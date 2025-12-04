package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import project.petch.petch_api.dto.ImageDTO;
import project.petch.petch_api.dto.pet.PetDTO;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.UserRepository;
import project.petch.petch_api.service.ImageService;
import project.petch.petch_api.service.PetService;

import java.io.IOException;
import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/pets")
@RequiredArgsConstructor
public class PetController{
    private final PetService petService;
    private final ImageService imageService;
    private final UserRepository userRepository;

    //get all pets
    //GET /api/pets
    @GetMapping
    public ResponseEntity<List<Pets>> getAllPets(){
        List<Pets> pets = petService.getAllPets();
        return ResponseEntity.ok(pets);
    }

    //get user's pets (for vendors)
    //GET /api/pets/user/{userId}
    @GetMapping("/user/{userId}")
    public ResponseEntity<List<Pets>> getUserPets(@PathVariable Long userId){
        List<Pets> pets = petService.getPetsByUserId(userId);
        return ResponseEntity.ok(pets);
    }

    //get pet by id
    //GET /api/pets/{id}
    @GetMapping("/{id}")
    public ResponseEntity<Pets> getPetById(@PathVariable Long id){
        return petService.getPetById(id).map(ResponseEntity::ok).orElse(ResponseEntity.notFound().build());
    }

    //create pet
    //POST /api/pets
    @PostMapping
    public ResponseEntity<Pets> createPet(@Valid @RequestBody PetDTO dto){
        try{
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
        }catch (Exception e){
            System.err.println("Error creating pet: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    //delete pet
    //DELETE /api/pets/{id}
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePet(@PathVariable Long id) throws IOException {
        try {
            imageService.deleteImagesByPet(id);
            petService.deletePet(id);
            return ResponseEntity.noContent().build();
        } catch (Exception e) {
            System.err.println("Error deleting pet: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    //update pet
    //PUT /api/pets/{id}
    @PutMapping("/{id}")
    public ResponseEntity<Pets> updatePet(@PathVariable Long id, @Valid @RequestBody PetDTO dto){
        try{
            Pets updatedPet = petService.updatePet(id, dto);
            return ResponseEntity.ok(updatedPet);
        }catch(RuntimeException e)
        {
            return ResponseEntity.notFound().build();
        }
    }

    //get all pets by species
    //GET /api/pets/filter/species?species=Dog
    @GetMapping("/filter/species")
    public ResponseEntity<List<Pets>> getPetsBySpecies(@RequestParam String species){
        List<Pets> pets = petService.findPetsBySpecies(species);
        return ResponseEntity.ok(pets);
    }

    //get all pets by breed
    //GET /api/pets/filter/breed?breed=Labrador
    @GetMapping("/filter/breed")
    public ResponseEntity<List<Pets>> getPetsByBreed(@RequestParam String breed){
        List<Pets> pets = petService.findPetsByBreed(breed);
        return ResponseEntity.ok(pets);
    }

    //search pets by name
    //GET /api/pets/search?name=Max
    @GetMapping("/search")
    public ResponseEntity<List<Pets>> searchPetsByName(@RequestParam String name){
        List<Pets> pets = petService.searchPetsByName(name);
        return ResponseEntity.ok(pets);
    }

    //filter pets by age range
    //GET /api/pets/filter/age?minAge=1&maxAge=5
    @GetMapping("/filter/age")
    public ResponseEntity<List<Pets>> filterPetsByAgeRange(@RequestParam int minAge, @RequestParam int maxAge){
        List<Pets> pets = petService.findPetsByAgeRange(minAge, maxAge);
        return ResponseEntity.ok(pets);
    }

    //get all at risk pets
    //GET /api/pets/filter/at-risk
    @GetMapping("/filter/at-risk")
    public ResponseEntity<List<Pets>> getAtRiskPets(){
        List<Pets> pets = petService.findAtRiskPets();
        return ResponseEntity.ok(pets);
    }

    //get all fosterable pets
    //GET /api/pets/filter/fosterable
    @GetMapping("/filter/fosterable")
    public ResponseEntity<List<Pets>> getFosterablePets(){
        List<Pets> pets = petService.findFosterablePets();
        return ResponseEntity.ok(pets);
    }

    //Get all images for a pet
    //GET /api/pets/{id}/images
    @GetMapping("/{id}/images")
    public ResponseEntity<List<ImageDTO>> getImagesForPet(@PathVariable Long id){
        List<ImageDTO> images = imageService.getImagesByPet(id);
        return ResponseEntity.ok(images);
    }

    //Upload image for a pet
    //POST /api/pets/{id}/images
    @PostMapping("/{id}/upload-image")
    public ResponseEntity<ImageDTO> uploadImageForPet(@PathVariable Long id, @RequestParam("file") MultipartFile file, @RequestParam(required = false) String altText) throws IOException {
        try{
            //System.out.println("Uploading image for pet " + id + ", file: " + file.getOriginalFilename());
            ImageDTO imageDTO = imageService.uploadImage(id, file, altText);
            //System.out.println("Image uploaded successfully: " + imageDTO.getFilePath());
            return ResponseEntity.created(URI.create("/api/pets/" + id + "/images/" + imageDTO.getId())).body(imageDTO);
        }catch(IllegalArgumentException e)
        {
            //System.err.println("Bad request uploading image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().build();
        }catch(Exception e)
        {
            //System.err.println("Error uploading image: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.internalServerError().build();
        }
    }

    //Delete image for a pet
    //DELETE /api/pets/{petId}/images/{imageId}
    @DeleteMapping("/{petId}/images/{imageId}")
    public ResponseEntity<Void> deleteImageForPet(@PathVariable Long petId, @PathVariable Long imageId) throws IOException {
        try{
            imageService.deleteImage(imageId);
            return ResponseEntity.noContent().build();
        }catch(RuntimeException e)
        {
            return ResponseEntity.notFound().build();
        }
    }

    //Get image count for a pet
    //GET /api/pets/{id}/images/count
    @GetMapping("/{id}/images/count")
    public ResponseEntity<Long> getImageCountForPet(@PathVariable Long id){
        long count = imageService.getImageCountForPet(id);
        return ResponseEntity.ok(count);
    }

    //total count of pets
    //GET /api/pets/stats/count
    @GetMapping("/stats/count")
    public ResponseEntity<Long> getTotalPetCount(){
        long count = petService.countAllPets();
        return ResponseEntity.ok(count);
    }

    //count of at risk pets
    //GET /api/pets/stats/count/at-risk
    @GetMapping("/stats/count/at-risk")
    public ResponseEntity<Long> getAtRiskPetCount(){
        long count = petService.countAtRiskPets();
        return ResponseEntity.ok(count);
    }

    //count of fosterable pets
    //GET /api/pets/stats/count/fosterable
    @GetMapping("/stats/count/fosterable")
    public ResponseEntity<Long> getFosterablePetCount(){
        long count = petService.countFosterablePets();
        return ResponseEntity.ok(count);
    }

    //count of pets by species
    //GET /api/pets/stats/count/species/{species}
    @GetMapping("/stats/count/species/{species}")
    public ResponseEntity<Long> getPetCountBySpecies(@PathVariable String species){
        long count = petService.countPetsBySpecies(species);
        return ResponseEntity.ok(count);
    }
}