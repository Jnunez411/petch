package project.petch.petch_api.repositories;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.petch.petch_api.models.AdoptionFormSubmission;

@Repository
public interface AdoptionFormSubmissionRepository extends JpaRepository<AdoptionFormSubmission, Long>{
    List<AdoptionFormSubmission> findByPetIdOrderByCreatedAtDesc(Long petId);
    List<AdoptionFormSubmission> findByPetUserIdOrderByCreatedAtDesc(Long vendorUserId);
    List<AdoptionFormSubmission> findByPetIdAndAdopterUserIdOrderByCreatedAtDesc(Long petId, Long adopterUserId);
    List<AdoptionFormSubmission> findByAdopterUserIdOrderByCreatedAtDesc(Long adopterUserId);
    Optional<AdoptionFormSubmission> findByIdAndPetId(Long id, Long petId);
    Optional<AdoptionFormSubmission> findByIdAndPetIdAndAdopterUserId(Long id, Long petId, Long adopterUserId);
    Optional<AdoptionFormSubmission> findByIdAndAdopterUserId(Long id, Long adopterUserId);
}