package project.petch.petch_api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.petch.petch_api.models.AdminAuditLog;

import java.util.List;

@Repository
public interface AdminAuditLogRepository extends JpaRepository<AdminAuditLog, Long> {

    List<AdminAuditLog> findTop100ByOrderByCreatedAtDesc();

    List<AdminAuditLog> findByAdminEmailOrderByCreatedAtDesc(String adminEmail);
}
