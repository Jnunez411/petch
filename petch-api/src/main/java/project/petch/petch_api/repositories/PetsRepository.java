package project.petch.petch_api.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import project.petch.petch_api.models.Pets;
import java.util.List;

public interface PetsRepository extends JpaRepository<Pets, Long> {
        List<Pets> findBySpeciesIgnoreCaseAndIsAdoptedFalse(String species);

        List<Pets> findByBreedIgnoreCaseAndIsAdoptedFalse(String breed);

        List<Pets> findByAtRiskTrueAndIsAdoptedFalse();

        List<Pets> findByAtRiskFalse();

        List<Pets> findByFosterableTrueAndIsAdoptedFalse();

        List<Pets> findByFosterableFalse();

        List<Pets> findByAgeBetweenAndIsAdoptedFalse(Integer minAge, Integer maxAge);

        List<Pets> findByNameContainingIgnoreCaseAndIsAdoptedFalse(String name);

        @Query("SELECT p FROM Pets p WHERE p.species = :species AND p.breed = :breed")
        List<Pets> findSpecificPetsByRace(@Param("species") String species, @Param("breed") String breed);

        long countByFosterableTrue();

        long countByAtRiskTrue();

        long countByIsAdoptedTrue();

        long countBySpeciesIgnoreCase(String species);

        // Find pets by user/vendor
        List<Pets> findByUserId(Long userId);

        // Eager fetch non-adopted pets with images and adoption details (public/discover feed only)
        @Query("SELECT DISTINCT p FROM Pets p LEFT JOIN FETCH p.images LEFT JOIN FETCH p.adoptionDetails WHERE p.isAdopted = false")
        List<Pets> findAllWithDetails();

        // Eager fetch single pet with details
        @Query("SELECT p FROM Pets p LEFT JOIN FETCH p.images LEFT JOIN FETCH p.adoptionDetails WHERE p.id = :id")
        java.util.Optional<Pets> findByIdWithDetails(@Param("id") Long id);

        // Filtered query with pagination and search (native SQL for reliable null
        // handling)
        @Query(value = "SELECT * FROM pets p WHERE " +
                        "(CAST(:search AS text) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(p.species) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(p.breed) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))) AND "
                        +
                        "(CAST(:species AS text) IS NULL OR UPPER(p.species) = UPPER(CAST(:species AS text))) AND "
                        +
                        "(CAST(:ageMin AS integer) IS NULL OR p.age >= CAST(:ageMin AS integer)) AND " +
                        "(CAST(:ageMax AS integer) IS NULL OR p.age <= CAST(:ageMax AS integer)) AND " +
                        "(CAST(:fosterable AS boolean) IS NULL OR p.fosterable = CAST(:fosterable AS boolean)) AND " +
                        "(CAST(:atRisk AS boolean) IS NULL OR p.at_risk = CAST(:atRisk AS boolean)) AND " +
                        "p.is_adopted = false", countQuery = "SELECT COUNT(*) FROM pets p WHERE "
                                        +
                                        "(CAST(:search AS text) IS NULL OR LOWER(p.name) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(p.species) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(p.breed) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%')) OR LOWER(p.description) LIKE LOWER(CONCAT('%', CAST(:search AS text), '%'))) AND "
                                        +
                                        "(CAST(:species AS text) IS NULL OR UPPER(p.species) = UPPER(CAST(:species AS text))) AND "
                                        +
                                        "(CAST(:ageMin AS integer) IS NULL OR p.age >= CAST(:ageMin AS integer)) AND " +
                                        "(CAST(:ageMax AS integer) IS NULL OR p.age <= CAST(:ageMax AS integer)) AND " +
                                        "(CAST(:fosterable AS boolean) IS NULL OR p.fosterable = CAST(:fosterable AS boolean)) AND "
                                        +
                                        "(CAST(:atRisk AS boolean) IS NULL OR p.at_risk = CAST(:atRisk AS boolean)) AND " +
                                        "p.is_adopted = false", nativeQuery = true)
        Page<Pets> findFilteredPets(
                        @Param("search") String search,
                        @Param("species") String species,
                        @Param("ageMin") Integer ageMin,
                        @Param("ageMax") Integer ageMax,
                        @Param("fosterable") Boolean fosterable,
                        @Param("atRisk") Boolean atRisk,
                        Pageable pageable);

        // Count for filtered results
        @Query("SELECT COUNT(p) FROM Pets p WHERE " +
                        "(:species IS NULL OR UPPER(CAST(p.species AS string)) = UPPER(CAST(:species AS string))) AND "
                        +
                        "(:ageMin IS NULL OR p.age >= :ageMin) AND " +
                        "(:ageMax IS NULL OR p.age <= :ageMax) AND " +
                        "(:fosterable IS NULL OR p.fosterable = :fosterable) AND " +
                        "(:atRisk IS NULL OR p.atRisk = :atRisk) AND " +
                        "p.isAdopted = false")
        long countFilteredPets(
                        @Param("species") String species,
                        @Param("ageMin") Integer ageMin,
                        @Param("ageMax") Integer ageMax,
                        @Param("fosterable") Boolean fosterable,
                        @Param("atRisk") Boolean atRisk);

        // Find trending non-adopted pets (ordered by view count, handles NULL, excludes test data)
        @Query("SELECT p FROM Pets p WHERE " +
                        "p.isAdopted = false AND " +
                        "p.name NOT LIKE '%SQL%' AND p.name NOT LIKE '%script%' AND p.name NOT LIKE '%DROP%' AND " +
                        "p.species NOT LIKE '%script%' AND p.species NOT LIKE '%img%' AND p.species NOT LIKE '%onerror%' "
                        +
                        "ORDER BY COALESCE(p.viewCount, 0) DESC, p.createdAt DESC")
        List<Pets> findTrendingPets(Pageable pageable);

        // PERFORMANCE: Database-level exclusion for discovery - avoids loading all pets
        // into memory
        @Query("SELECT DISTINCT p FROM Pets p LEFT JOIN FETCH p.images LEFT JOIN FETCH p.adoptionDetails WHERE p.id NOT IN :excludedIds AND p.isAdopted = false")
        List<Pets> findPetsNotIn(@Param("excludedIds") List<Long> excludedIds);

        // PERFORMANCE: Proper count query instead of loading all records
        long countByBreedIgnoreCase(String breed);
}