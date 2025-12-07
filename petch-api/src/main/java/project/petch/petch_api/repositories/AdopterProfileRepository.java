package project.petch.petch_api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.petch.petch_api.models.AdopterProfile;

import java.util.Optional;

@Repository
public interface AdopterProfileRepository extends JpaRepository<AdopterProfile, Long> {
    Optional<AdopterProfile> findByUserId(Long userId);
    boolean existsByUserId(Long userId);
}
