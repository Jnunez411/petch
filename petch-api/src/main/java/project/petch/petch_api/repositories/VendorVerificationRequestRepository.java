package project.petch.petch_api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.petch.petch_api.models.VerificationRequestStatus;
import project.petch.petch_api.models.VendorVerificationRequest;

import java.util.List;

@Repository
public interface VendorVerificationRequestRepository extends JpaRepository<VendorVerificationRequest, Long> {

    List<VendorVerificationRequest> findByStatusOrderBySubmittedAtAsc(VerificationRequestStatus status);

    boolean existsByVendorProfileIdAndStatus(Long vendorProfileId, VerificationRequestStatus status);
}
