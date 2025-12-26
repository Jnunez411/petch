package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.petch.petch_api.dto.admin.AdminStatsDto;
import project.petch.petch_api.dto.user.UserType;
import project.petch.petch_api.models.AdminAuditLog;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.AdminAuditLogRepository;
import project.petch.petch_api.repositories.PetsRepository;
import project.petch.petch_api.repositories.UserRepository;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdminService {

    private final UserRepository userRepository;
    private final PetsRepository petsRepository;
    private final AdminAuditLogRepository auditLogRepository;

    /**
     * Get admin dashboard statistics using efficient count queries
     */
    public AdminStatsDto getStats() {
        long totalUsers = userRepository.count();
        long totalPets = petsRepository.count();
        long totalAdopters = userRepository.countByUserType(UserType.ADOPTER);
        long totalVendors = userRepository.countByUserType(UserType.VENDOR);

        return AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .totalPets(totalPets)
                .totalAdopters(totalAdopters)
                .totalVendors(totalVendors)
                .build();
    }

    // PERFORMANCE: Added pagination to avoid loading all users at once
    public Page<User> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable);
    }

    /**
     * Delete a user by ID with validation and audit logging
     */
    @Transactional
    public void deleteUser(Long id) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        User userToDelete = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + id));

        // Prevent admin from deleting themselves
        if (userToDelete.getEmail().equals(currentUserEmail)) {
            throw new IllegalStateException("Cannot delete your own admin account");
        }

        // Log the action before deletion
        String targetDetails = String.format("User: %s %s (%s) - Type: %s",
                userToDelete.getFirstName(),
                userToDelete.getLastName(),
                userToDelete.getEmail(),
                userToDelete.getUserType());

        auditLog(currentUserEmail, "DELETE_USER", "USER", id, targetDetails);

        log.info("Admin {} deleted user: {}", currentUserEmail, targetDetails);
        userRepository.deleteById(id);
    }

    // PERFORMANCE: Added pagination to avoid loading all pets at once
    public Page<Pets> getAllPets(Pageable pageable) {
        return petsRepository.findAll(pageable);
    }

    /**
     * Delete a pet by ID with validation and audit logging
     */
    @Transactional
    public void deletePet(Long id) {
        String currentUserEmail = SecurityContextHolder.getContext().getAuthentication().getName();

        Pets petToDelete = petsRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Pet not found with ID: " + id));

        // Log the action before deletion
        String targetDetails = String.format("Pet: %s (%s - %s), Age: %d",
                petToDelete.getName(),
                petToDelete.getSpecies(),
                petToDelete.getBreed(),
                petToDelete.getAge());

        auditLog(currentUserEmail, "DELETE_PET", "PET", id, targetDetails);

        log.info("Admin {} deleted pet: {}", currentUserEmail, targetDetails);
        petsRepository.deleteById(id);
    }

    /**
     * Get recent audit logs for admin dashboard
     */
    public List<AdminAuditLog> getRecentAuditLogs() {
        return auditLogRepository.findTop100ByOrderByCreatedAtDesc();
    }

    /**
     * Create an audit log entry
     */
    private void auditLog(String adminEmail, String action, String targetType, Long targetId, String targetDetails) {
        AdminAuditLog logEntry = AdminAuditLog.builder()
                .adminEmail(adminEmail)
                .action(action)
                .targetType(targetType)
                .targetId(targetId)
                .targetDetails(targetDetails)
                .build();

        auditLogRepository.save(logEntry);
    }
}
