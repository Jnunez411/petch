package project.petch.petch_api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.petch.petch_api.models.VerificationStatus;
import project.petch.petch_api.models.VendorProfile;

import java.util.List;
import java.util.Optional;

@Repository
public interface VendorProfileRepository extends JpaRepository<VendorProfile, Long> {
    
    Optional<VendorProfile> findByUserId(Long userId);
    
    boolean existsByUserId(Long userId);

    List<VendorProfile> findByVerificationStatusOrderByCreatedAtAsc(VerificationStatus verificationStatus);
}
