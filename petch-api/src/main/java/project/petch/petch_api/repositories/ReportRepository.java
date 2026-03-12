package project.petch.petch_api.repositories;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.petch.petch_api.models.Report;
import project.petch.petch_api.models.ReportStatus;
import project.petch.petch_api.models.User;

@Repository
public interface ReportRepository extends JpaRepository<Report, Long> {

    Page<Report> findByStatus(ReportStatus status, Pageable pageable);

    Page<Report> findAllByOrderByCreatedAtDesc(Pageable pageable);

    long countByStatus(ReportStatus status);

    boolean existsByReporterAndPetId(User reporter, Long petId);

    void deleteByPetId(Long petId);
}
