package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import project.petch.petch_api.dto.pet.ImageDTO;
import project.petch.petch_api.dto.pet.PetDTO;
import project.petch.petch_api.models.PetInteraction;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.UserRepository;
import project.petch.petch_api.service.ImageService;
import project.petch.petch_api.service.PetService;
import project.petch.petch_api.service.SecurityEventLogger;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URI;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController {
    private final PetService petService;
    private final ImageService imageService;
    private final UserRepository userRepository;
    private final SecurityEventLogger securityEventLogger;
    private final HttpServletRequest httpServletRequest;

    // GET /api/pets/discover
    @GetMapping("/discover")
    public ResponseEntity<List<Pets>> discoverPets(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(petService.discoverPets(user));
    }

    // GET /api/pets/liked - Get user's liked pets
    @GetMapping("/liked")
    public ResponseEntity<List<Pets>> getLikedPets(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        return ResponseEntity.ok(petService.getLikedPets(user));
    }

    // POST /api/pets/{id}/interact
    @PostMapping("/{id}/interact")
    public ResponseEntity<Void> interactWithPet(
            @PathVariable Long id,
            @AuthenticationPrincipal User user,
            @RequestBody Map<String, String> body) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        String type = body.get("type");
        PetInteraction.InteractionType interactionType = PetInteraction.InteractionType.valueOf(type.toUpperCase());
        petService.recordInteraction(user, id, interactionType);
        return ResponseEntity.ok().build();
    }

    // DELETE /api/pets/{id}/interact
    @DeleteMapping("/{id}/interact")
    public ResponseEntity<Void> deleteInteraction(
            @PathVariable Long id,
            @AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        petService.deleteInteraction(user, id);
        return ResponseEntity.noContent().build();
    }

    // POST /api/pets/discover/reset
    @PostMapping("/discover/reset")
    public ResponseEntity<Void> resetDiscovery(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).build();
        }
        petService.resetDiscovery(user);
        return ResponseEntity.ok().build();
    }

    // get all pets with optional filtering
    // GET
    // /api/pets?species=Dog&ageMin=1&ageMax=5&fosterable=true&atRisk=true&page=0&size=12
    @GetMapping
    public ResponseEntity<Page<Pets>> getFilteredPets(
            @RequestParam(required = false) String species,
            @RequestParam(required = false) Integer ageMin,
            @RequestParam(required = false) Integer ageMax,
            @RequestParam(required = false) Boolean fosterable,
            @RequestParam(required = false) Boolean atRisk,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size) {

        Pageable pageable = PageRequest.of(page, size);
        Page<Pets> pets = petService.getFilteredPets(species, ageMin, ageMax, fosterable, atRisk, pageable);
        return ResponseEntity.ok(pets);
    }

    // get user's pets (for vendors)
    // GET /api/pets/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Pets>> getUserPets(@PathVariable Long userId) {
        List<Pets> pets = petService.getPetsByUserId(userId);
        return ResponseEntity.ok(pets);
    }

    // get pet by id (also increments view count)
    // GET /api/pets/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Pets> getPetById(@PathVariable Long id) {
        return petService.getPetById(id)
                .map(pet -> {
                    // Increment view count for trending logic
                    petService.incrementViewCount(id);
                    return ResponseEntity.ok(pet);
                })
                .orElse(ResponseEntity.notFound().build());
    }

    // Get trending pets (most viewed)
    // GET /api/pets/trending?count=8
    @GetMapping("/trending")
    public ResponseEntity<List<Pets>> getTrendingPets(
            @RequestParam(defaultValue = "8") int count) {
        List<Pets> pets = petService.getTrendingPets(count);
        return ResponseEntity.ok(pets);
    }

    // create pet
    // POST /api/pets
    @PostMapping
    public ResponseEntity<Pets> createPet(@Valid @RequestBody PetDTO dto) {
        try {
            User user = null;
            if (dto.getUserId() != null) {
                user = userRepository.findById(dto.getUserId()).orElse(null);
            }

            Pets pet = Pets.builder()
                    .name(dto.getName())
                    .species(dto.getSpecies())
                    .breed(dto.getBreed())
                    .age(dto.getAge())
                    .description(dto.getDescription())
                    .atRisk(dto.getAtRisk() != null ? dto.getAtRisk() : false)
                    .fosterable(dto.getFosterable() != null ? dto.getFosterable() : false)
                    .user(user)
                    .build();
            Pets createdPet = petService.createPet(pet);
            return ResponseEntity.created(URI.create("/api/pets/" + createdPet.getId())).body(createdPet);
        } catch (Exception e) {
            System.err.println("Error creating pet: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // delete pet
    // DELETE /api/pets/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePet(@PathVariable Long id, @AuthenticationPrincipal User user)
            throws IOException {
        try {
            // SECURITY: Verify ownership before allowing delete
            if (user == null) {
                return ResponseEntity.status(401).build();
            }
            Pets pet = petService.getPetById(id).orElse(null);
            if (pet == null) {
                return ResponseEntity.notFound().build();
            }
            // Allow admins to delete any pet, otherwise check ownership
            boolean isAdmin = user.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin && (pet.getUser() == null || !pet.getUser().getId().equals(user.getId()))) {
                // SECURITY: Log IDOR attempt
                securityEventLogger.logIdorAttempt(
                        getClientIP(), user.getId().toString(), "pet-delete", id);
                return ResponseEntity.status(403).build();
            }
            imageService.deleteImagesByPet(id);
            petService.deletePet(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting pet: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // update pet
    // PUT /api/pets/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Pets> updatePet(@PathVariable Long id, @Valid @RequestBody PetDTO dto,
            @AuthenticationPrincipal User user) {
        try {
            // SECURITY: Verify ownership before allowing update
            if (user == null) {
                return ResponseEntity.status(401).build();
            }
            Pets existingPet = petService.getPetById(id).orElse(null);
            if (existingPet == null) {
                return ResponseEntity.notFound().build();
            }
            // Allow admins to update any pet, otherwise check ownership
            boolean isAdmin = user.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin && (existingPet.getUser() == null || !existingPet.getUser().getId().equals(user.getId()))) {
                // SECURITY: Log IDOR attempt
                securityEventLogger.logIdorAttempt(
                        getClientIP(), user.getId().toString(), "pet-update", id);
                return ResponseEntity.status(403).build();
            }
            Pets updatedPet = petService.updatePet(id, dto);
            return ResponseEntity.ok(updatedPet);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // get all pets by species
    // GET /api/pets/filter/species?species=Dog
    @GetMapping("/filter/species")
    public ResponseEntity<List<Pets>> getPetsBySpecies(@RequestParam String species) {
        List<Pets> pets = petService.findPetsBySpecies(species);
        return ResponseEntity.ok(pets);
    }

    // get all pets by breed
    // GET /api/pets/filter/breed?breed=Labrador
    @GetMapping("/filter/breed")
    public ResponseEntity<List<Pets>> getPetsByBreed(@RequestParam String breed) {
        List<Pets> pets = petService.findPetsByBreed(breed);
        return ResponseEntity.ok(pets);
    }

    // search pets by name
    // GET /api/pets/search?name=Max
    @GetMapping("/search")
    public ResponseEntity<List<Pets>> searchPetsByName(@RequestParam String name) {
        List<Pets> pets = petService.searchPetsByName(name);
        return ResponseEntity.ok(pets);
    }

    // filter pets by age range
    // GET /api/pets/filter/age?minAge=1&maxAge=5
    @GetMapping("/filter/age")
    public ResponseEntity<List<Pets>> filterPetsByAgeRange(@RequestParam int minAge, @RequestParam int maxAge) {
        List<Pets> pets = petService.findPetsByAgeRange(minAge, maxAge);
        return ResponseEntity.ok(pets);
    }

    // get all at risk pets
    // GET /api/pets/filter/at-risk
    @GetMapping("/filter/at-risk")
    public ResponseEntity<List<Pets>> getAtRiskPets() {
        List<Pets> pets = petService.findAtRiskPets();
        return ResponseEntity.ok(pets);
    }

    // get all fosterable pets
    // GET /api/pets/filter/fosterable
    @GetMapping("/filter/fosterable")
    public ResponseEntity<List<Pets>> getFosterablePets() {
        List<Pets> pets = petService.findFosterablePets();
        return ResponseEntity.ok(pets);
    }

    // Get all images for a pet
    // GET /api/pets/{id}/images
    @GetMapping("/{id}/images")
    public ResponseEntity<List<ImageDTO>> getImagesForPet(@PathVariable Long id) {
        List<ImageDTO> images = imageService.getImagesByPet(id);
        return ResponseEntity.ok(images);
    }

    // Upload image for a pet
    // POST /api/pets/{id}/images
    @PostMapping("/{id}/upload-image")
    public ResponseEntity<ImageDTO> uploadImageForPet(@PathVariable Long id, @RequestParam("file") MultipartFile file,
            @RequestParam(required = false) String altText, @AuthenticationPrincipal User user) throws IOException {
        try {
            // SECURITY: Verify ownership before allowing image upload
            if (user == null) {
                return ResponseEntity.status(401).build();
            }
            Pets pet = petService.getPetById(id).orElse(null);
            if (pet == null) {
                return ResponseEntity.notFound().build();
            }
            // Allow admins to upload for any pet, otherwise check ownership
            boolean isAdmin = user.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin && (pet.getUser() == null || !pet.getUser().getId().equals(user.getId()))) {
                // SECURITY: Log IDOR attempt
                securityEventLogger.logIdorAttempt(
                        getClientIP(), user.getId().toString(), "image-upload", id);
                return ResponseEntity.status(403).build();
            }

            ImageDTO imageDTO = imageService.uploadImage(id, file, altText);
            return ResponseEntity.created(URI.create("/api/pets/" + id + "/images/" + imageDTO.getId())).body(imageDTO);
        } catch (IllegalArgumentException e) {
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    // Delete image for a pet
    // DELETE /api/pets/{petId}/images/{imageId}
    @DeleteMapping("/{petId}/images/{imageId}")
    public ResponseEntity<Void> deleteImageForPet(@PathVariable Long petId, @PathVariable Long imageId,
            @AuthenticationPrincipal User user) throws IOException {
        try {
            // SECURITY: Verify ownership before allowing image deletion
            if (user == null) {
                return ResponseEntity.status(401).build();
            }
            Pets pet = petService.getPetById(petId).orElse(null);
            if (pet == null) {
                return ResponseEntity.notFound().build();
            }
            // Allow admins to delete any pet's images, otherwise check ownership
            boolean isAdmin = user.getAuthorities().stream()
                    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
            if (!isAdmin && (pet.getUser() == null || !pet.getUser().getId().equals(user.getId()))) {
                // SECURITY: Log IDOR attempt
                securityEventLogger.logIdorAttempt(
                        getClientIP(), user.getId().toString(), "image-delete", petId);
                return ResponseEntity.status(403).build();
            }

            imageService.deleteImage(imageId);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // Get image count for a pet
    // GET /api/pets/{id}/images/count
    @GetMapping("/{id}/images/count")
    public ResponseEntity<Long> getImageCountForPet(@PathVariable Long id) {
        long count = imageService.getImageCountForPet(id);
        return ResponseEntity.ok(count);
    }

    // total count of pets
    // GET /api/pets/stats/count
    @GetMapping("/stats/count")
    public ResponseEntity<Long> getTotalPetCount() {
        long count = petService.countAllPets();
        return ResponseEntity.ok(count);
    }

    // count of at risk pets
    // GET /api/pets/stats/count/at-risk
    @GetMapping("/stats/count/at-risk")
    public ResponseEntity<Long> getAtRiskPetCount() {
        long count = petService.countAtRiskPets();
        return ResponseEntity.ok(count);
    }

    // count of fosterable pets
    // GET /api/pets/stats/count/fosterable
    @GetMapping("/stats/count/fosterable")
    public ResponseEntity<Long> getFosterablePetCount() {
        long count = petService.countFosterablePets();
        return ResponseEntity.ok(count);
    }

    // count of pets by species
    // GET /api/pets/stats/count/species/{species}
    @GetMapping("/stats/count/species/{species}")
    public ResponseEntity<Long> getPetCountBySpecies(@PathVariable String species) {
        long count = petService.countPetsBySpecies(species);
        return ResponseEntity.ok(count);
    }

    /**
     * Extract client IP address, handling proxies.
     */
    private String getClientIP() {
        String xForwardedFor = httpServletRequest.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        return httpServletRequest.getRemoteAddr();
    }
}