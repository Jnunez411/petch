package project.petch.petch_api.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import project.petch.petch_api.models.AdoptionAppointment;

@Repository
public interface AdoptionAppointmentRepository extends JpaRepository<AdoptionAppointment, Long> {
    List<AdoptionAppointment> findByAdopterUserIdOrderByCreatedAtDesc(Long adopterUserId);
    List<AdoptionAppointment> findByVendorUserIdOrderByCreatedAtDesc(Long vendorUserId);
    boolean existsBySubmissionId(Long submissionId);
}
