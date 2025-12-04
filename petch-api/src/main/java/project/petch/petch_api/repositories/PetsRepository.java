package project.petch.petch_api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.petch.petch_api.models.Pets;
import java.util.List;

public interface PetsRepository extends JpaRepository<Pets, Long>{
    List<Pets> findBySpeciesIgnoreCase(String species);
    List<Pets> findByBreedIgnoreCase(String breed);

    List<Pets> findByAtRiskTrue();
    List<Pets> findByAtRiskFalse();

    List<Pets> findByFosterableTrue();
    List<Pets> findByFosterableFalse();

    List<Pets> findByAgeBetween(Integer minAge, Integer maxAge);

    List<Pets> findByNameContainingIgnoreCase(String name);

    @Query("SELECT p FROM Pets p WHERE p.species = :species AND p.breed = :breed")
    List<Pets> findSpecificPetsByRace(@Param("species") String species, @Param("breed") String breed);

    long countByFosterableTrue();
    long countByAtRiskTrue();
    long countBySpeciesIgnoreCase(String species);

    // Find pets by user/vendor
    List<Pets> findByUserId(Long userId);
}