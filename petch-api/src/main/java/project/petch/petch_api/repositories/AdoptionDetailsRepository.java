package project.petch.petch_api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.petch.petch_api.models.AdoptionDetails;

import java.util.Optional;

@Repository
public interface AdoptionDetailsRepository extends JpaRepository<AdoptionDetails, Long> {
    Optional<AdoptionDetails> findByPetId(Long petId);
}
