package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import project.petch.petch_api.dto.pet.PetDTO;
import project.petch.petch_api.models.PetInteraction;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.models.UserPreference;
import project.petch.petch_api.repositories.PetInteractionRepository;
import project.petch.petch_api.repositories.PetsRepository;
import project.petch.petch_api.repositories.UserPreferenceRepository;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PetService {
    private final PetsRepository petsRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final PetInteractionRepository petInteractionRepository;

    public List<Pets> discoverPets(User user) {
        UserPreference prefs = userPreferenceRepository.findByUser(user)
                .orElseGet(() -> userPreferenceRepository.save(
                        UserPreference.builder().user(user).build()));

        List<Long> interactedPetIds = petInteractionRepository.findByUser(user)
                .stream()
                .map(i -> i.getPet().getId())
                .collect(Collectors.toList());

        // PERFORMANCE: Use database-level exclusion instead of loading all pets
        List<Pets> availablePets = interactedPetIds.isEmpty()
                ? petsRepository.findAllWithDetails()
                : petsRepository.findPetsNotIn(interactedPetIds);

        // PERFORMANCE: Sort by match score and limit to top 50
        return availablePets.stream()
                .sorted((p1, p2) -> Double.compare(
                        calculateMatchScore(p2, prefs),
                        calculateMatchScore(p1, prefs)))
                .limit(50)
                .collect(Collectors.toList());
    }

    /**
     * Get all pets the user has liked.
     */
    public List<Pets> getLikedPets(User user) {
        return petInteractionRepository.findByUserAndInteractionType(user, PetInteraction.InteractionType.LIKE)
                .stream()
                .map(PetInteraction::getPet)
                .collect(Collectors.toList());
    }

    /**
     * Get filtered and paginated pets for the pet listings page.
     */
    public Page<Pets> getFilteredPets(
            String species,
            Integer ageMin,
            Integer ageMax,
            Boolean fosterable,
            Boolean atRisk,
            Pageable pageable) {
        return petsRepository.findFilteredPets(species, ageMin, ageMax, fosterable, atRisk, pageable);
    }

    /**
     * Get all pets with eager-loaded images and adoption details.
     */
    public List<Pets> getAllPetsWithDetails() {
        return petsRepository.findAllWithDetails();
    }

    private double calculateMatchScore(Pets pet, UserPreference prefs) {
        double score = 0;
        String species = pet.getSpecies().toLowerCase();
        String breed = pet.getBreed().toLowerCase();

        score += prefs.getSpeciesWeights().getOrDefault(species, 0.0) * 3;
        score += prefs.getBreedWeights().getOrDefault(breed, 0.0) * 2;

        int age = pet.getAge();
        if (age <= 2)
            score += prefs.getWeightYoung() * 1.5;
        else if (age <= 5)
            score += prefs.getWeightAdult() * 1.5;
        else if (age <= 10)
            score += prefs.getWeightMature() * 1.5;
        else
            score += prefs.getWeightSenior() * 1.5;

        if (pet.getFosterable())
            score += prefs.getFosterableWeight();
        if (pet.getAtRisk())
            score += prefs.getAtRiskWeight();

        // Use pet ID as stable tiebreaker instead of random (random breaks comparator
        // contract!)
        return score + (pet.getId() % 100) * 0.001;
    }

    public void recordInteraction(User user, Long petId, PetInteraction.InteractionType type) {
        Pets pet = petsRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found"));

        petInteractionRepository.save(PetInteraction.builder()
                .user(user)
                .pet(pet)
                .interactionType(type)
                .build());

        updatePreferences(user, pet, type);
    }

    private void updatePreferences(User user, Pets pet, PetInteraction.InteractionType type) {
        UserPreference prefs = userPreferenceRepository.findByUser(user)
                .orElseGet(() -> UserPreference.builder().user(user).build());

        double learningRate = type == PetInteraction.InteractionType.LIKE ? 0.5 : -0.2;
        String species = pet.getSpecies().toLowerCase();
        String breed = pet.getBreed().toLowerCase();

        prefs.getSpeciesWeights().put(species, prefs.getSpeciesWeights().getOrDefault(species, 0.0) + learningRate);
        prefs.getBreedWeights().put(breed, prefs.getBreedWeights().getOrDefault(breed, 0.0) + learningRate * 0.5);

        int age = pet.getAge();
        if (age <= 2)
            prefs.setWeightYoung(prefs.getWeightYoung() + learningRate * 0.3);
        else if (age <= 5)
            prefs.setWeightAdult(prefs.getWeightAdult() + learningRate * 0.3);
        else if (age <= 10)
            prefs.setWeightMature(prefs.getWeightMature() + learningRate * 0.3);
        else
            prefs.setWeightSenior(prefs.getWeightSenior() + learningRate * 0.3);

        if (pet.getFosterable())
            prefs.setFosterableWeight(prefs.getFosterableWeight() + learningRate * 0.2);
        if (pet.getAtRisk())
            prefs.setAtRiskWeight(prefs.getAtRiskWeight() + learningRate * 0.2);

        prefs.setTotalSwipes(prefs.getTotalSwipes() + 1);
        userPreferenceRepository.save(prefs);
    }

    public List<Pets> getAllPets() {
        return petsRepository.findAll();
    }

    public List<Pets> getPetsByUserId(Long userId) {
        return petsRepository.findByUserId(userId);
    }

    public Optional<Pets> getPetById(Long id) {
        return petsRepository.findByIdWithDetails(id);
    }

    public void resetDiscovery(User user) {
        List<PetInteraction> interactions = petInteractionRepository.findByUser(user);
        petInteractionRepository.deleteAll(interactions);

        // Also reset preference weights to neutral
        userPreferenceRepository.findByUser(user).ifPresent(prefs -> {
            prefs.getSpeciesWeights().clear();
            prefs.getBreedWeights().clear();
            prefs.setWeightYoung(1.0);
            prefs.setWeightAdult(1.0);
            prefs.setWeightMature(1.0);
            prefs.setWeightSenior(1.0);
            prefs.setFosterableWeight(1.0);
            prefs.setAtRiskWeight(1.0);
            prefs.setTotalSwipes(0);
            userPreferenceRepository.save(prefs);
        });
    }

    public Pets createPet(Pets pet) {
        return petsRepository.save(pet);
    }

    public void deletePet(Long id) {
        petsRepository.deleteById(id);
    }

    public Pets updatePet(Long id, Pets updatedPet) {
        return petsRepository.findById(id).map(pet -> {
            pet.setName(updatedPet.getName());
            pet.setSpecies(updatedPet.getSpecies());
            pet.setBreed(updatedPet.getBreed());
            pet.setAge(updatedPet.getAge());
            pet.setDescription(updatedPet.getDescription());
            pet.setAtRisk(updatedPet.getAtRisk());
            pet.setFosterable(updatedPet.getFosterable());
            return petsRepository.save(pet);
        }).orElseThrow(() -> new RuntimeException("Pet not found with id " + id));
    }

    public Pets updatePet(Long id, PetDTO dto) {
        return petsRepository.findById(id).map(pet -> {
            pet.setName(dto.getName());
            pet.setSpecies(dto.getSpecies());
            pet.setBreed(dto.getBreed());
            pet.setAge(dto.getAge());
            pet.setDescription(dto.getDescription());
            pet.setAtRisk(dto.getAtRisk() != null ? dto.getAtRisk() : false);
            pet.setFosterable(dto.getFosterable() != null ? dto.getFosterable() : false);
            return petsRepository.save(pet);
        }).orElseThrow(() -> new RuntimeException("Pet not found with id " + id));
    }

    public List<Pets> findPetsBySpecies(String species) {
        return petsRepository.findBySpeciesIgnoreCase(species);
    }

    public List<Pets> findPetsByBreed(String breed) {
        return petsRepository.findByBreedIgnoreCase(breed);
    }

    public List<Pets> findPetsByAgeRange(Integer minAge, Integer maxAge) {
        return petsRepository.findByAgeBetween(minAge, maxAge);
    }

    public List<Pets> searchPetsByName(String name) {
        return petsRepository.findByNameContainingIgnoreCase(name);
    }

    public List<Pets> findSpecificPetsByRace(String species, String breed) {
        return petsRepository.findSpecificPetsByRace(species, breed);
    }

    public List<Pets> findAtRiskPets() {
        return petsRepository.findByAtRiskTrue();
    }

    public List<Pets> findFosterablePets() {
        return petsRepository.findByFosterableTrue();
    }

    public long countFosterablePets() {
        return petsRepository.countByFosterableTrue();
    }

    public long countAtRiskPets() {
        return petsRepository.countByAtRiskTrue();
    }

    public long countPetsBySpecies(String species) {
        return petsRepository.countBySpeciesIgnoreCase(species);
    }

    public long countPetsByBreed(String breed) {
        // PERFORMANCE: Use proper count query instead of loading all records
        return petsRepository.countByBreedIgnoreCase(breed);
    }

    @Cacheable(value = "petCounts", key = "'all'")
    public long countAllPets() {
        return petsRepository.count();
    }

    /**
     * Increment view count for a pet (used for trending logic).
     * PERFORMANCE: Made async to avoid blocking request threads.
     */
    @Async("asyncExecutor")
    public void incrementViewCount(Long petId) {
        petsRepository.findById(petId).ifPresent(pet -> {
            Long currentCount = pet.getViewCount() != null ? pet.getViewCount() : 0L;
            pet.setViewCount(currentCount + 1);
            petsRepository.save(pet);
        });
    }

    /**
     * Get trending pets (most viewed).
     * PERFORMANCE: Cached for 5 minutes to reduce database load.
     */
    @Cacheable(value = "trendingPets", key = "#count")
    public List<Pets> getTrendingPets(int count) {
        Pageable pageable = org.springframework.data.domain.PageRequest.of(0, count);
        return petsRepository.findTrendingPets(pageable);
    }

    /**
     * Delete an interaction (Undo) and reverse learned preferences.
     */
    public void deleteInteraction(User user, Long petId) {
        PetInteraction interaction = petInteractionRepository.findByUserAndPet_Id(user, petId)
                .orElseThrow(() -> new RuntimeException("Interaction not found"));

        Pets pet = interaction.getPet();
        PetInteraction.InteractionType type = interaction.getInteractionType();

        petInteractionRepository.delete(interaction);

        // Reverse preference learning and decrement total swipes
        userPreferenceRepository.findByUser(user).ifPresent(prefs -> {
            // Reverse the learning rate that was applied
            double reverseLearningRate = type == PetInteraction.InteractionType.LIKE ? -0.5 : 0.2;
            String species = pet.getSpecies().toLowerCase();
            String breed = pet.getBreed().toLowerCase();

            // Reverse species and breed weights
            prefs.getSpeciesWeights().put(species,
                    prefs.getSpeciesWeights().getOrDefault(species, 0.0) + reverseLearningRate);
            prefs.getBreedWeights().put(breed,
                    prefs.getBreedWeights().getOrDefault(breed, 0.0) + reverseLearningRate * 0.5);

            // Reverse age category weights
            int age = pet.getAge();
            if (age <= 2)
                prefs.setWeightYoung(prefs.getWeightYoung() + reverseLearningRate * 0.3);
            else if (age <= 5)
                prefs.setWeightAdult(prefs.getWeightAdult() + reverseLearningRate * 0.3);
            else if (age <= 10)
                prefs.setWeightMature(prefs.getWeightMature() + reverseLearningRate * 0.3);
            else
                prefs.setWeightSenior(prefs.getWeightSenior() + reverseLearningRate * 0.3);

            // Reverse fosterable/atRisk weights
            if (pet.getFosterable())
                prefs.setFosterableWeight(prefs.getFosterableWeight() + reverseLearningRate * 0.2);
            if (pet.getAtRisk())
                prefs.setAtRiskWeight(prefs.getAtRiskWeight() + reverseLearningRate * 0.2);

            // Decrement total swipes
            if (prefs.getTotalSwipes() > 0) {
                prefs.setTotalSwipes(prefs.getTotalSwipes() - 1);
            }

            userPreferenceRepository.save(prefs);
        });
    }
}