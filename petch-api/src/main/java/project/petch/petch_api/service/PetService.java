package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import project.petch.petch_api.dto.pet.PetDTO;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.repositories.PetsRepository;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class PetService{
    private final PetsRepository petsRepository;

    public List<Pets> getAllPets() 
    {
        return petsRepository.findAll();
    }

    public List<Pets> getPetsByUserId(Long userId)
    {
        return petsRepository.findByUserId(userId);
    }

    public Optional<Pets> getPetById(Long id) 
    {
        return petsRepository.findById(id);
    }

    public Pets createPet(Pets pet) 
    {
        return petsRepository.save(pet);
    }

    public void deletePet(Long id) 
    {
        petsRepository.deleteById(id);
    }

    public Pets updatePet(Long id, Pets updatedPet) 
    {
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

    public Pets updatePet(Long id, PetDTO dto)
    {
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

        public List<Pets> findPetsBySpecies(String species) 
        {
            return petsRepository.findBySpeciesIgnoreCase(species);
        }

        public List<Pets> findPetsByBreed(String breed) 
        {
            return petsRepository.findByBreedIgnoreCase(breed);
        }

        public List<Pets> findPetsByAgeRange(Integer minAge, Integer maxAge) 
        {
            return petsRepository.findByAgeBetween(minAge, maxAge);
        }

        public List<Pets> searchPetsByName(String name) 
        {
            return petsRepository.findByNameContainingIgnoreCase(name);
        }

        public List<Pets> findSpecificPetsByRace(String species, String breed) 
        {
            return petsRepository.findSpecificPetsByRace(species, breed);
        }

        public List<Pets> findAtRiskPets() 
        {
            return petsRepository.findByAtRiskTrue();
        }

        public List<Pets> findFosterablePets() 
        {
            return petsRepository.findByFosterableTrue();
        }

        public long countFosterablePets() 
        {
            return petsRepository.countByFosterableTrue();
        }

        public long countAtRiskPets() 
        {
            return petsRepository.countByAtRiskTrue();
        }

        public long countPetsBySpecies(String species) 
        {
            return petsRepository.countBySpeciesIgnoreCase(species);
        }

        public long countPetsByBreed(String breed) 
        {
            return petsRepository.findByBreedIgnoreCase(breed).size();
        }

        public long countAllPets() 
        {
            return petsRepository.count();
        }
}