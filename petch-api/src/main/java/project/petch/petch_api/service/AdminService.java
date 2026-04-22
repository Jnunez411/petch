package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.petch.petch_api.dto.admin.AdminStatsDto;
import project.petch.petch_api.dto.admin.AdminUserDto;
import project.petch.petch_api.dto.user.UserType;
import project.petch.petch_api.models.AdminAuditLog;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.models.ReportStatus;
import project.petch.petch_api.repositories.AdminAuditLogRepository;
import project.petch.petch_api.repositories.PasswordResetTokenRepository;
import project.petch.petch_api.repositories.PetInteractionRepository;
import project.petch.petch_api.repositories.PetsRepository;
import project.petch.petch_api.repositories.ReportRepository;
import project.petch.petch_api.repositories.UserPreferenceRepository;
import project.petch.petch_api.repositories.UserRepository;
import project.petch.petch_api.service.ImageService;

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
    private final ReportRepository reportRepository;
    private final PetInteractionRepository petInteractionRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final ImageService imageService;
    private final PetDocumentsService petDocumentsService;

    /**
     * Get admin dashboard statistics using efficient count queries
     */
    public AdminStatsDto getStats() {
        long totalUsers = userRepository.count();
        long totalPets = petsRepository.count();
        long totalAdoptedPets = petsRepository.countByIsAdoptedTrue();
        long totalAdopters = userRepository.countByUserType(UserType.ADOPTER);
        long totalVendors = userRepository.countByUserType(UserType.VENDOR);
        long pendingReports = reportRepository.countByStatus(ReportStatus.PENDING);

        return AdminStatsDto.builder()
                .totalUsers(totalUsers)
                .totalPets(totalPets)
                .totalAdoptedPets(totalAdoptedPets)
                .totalAdopters(totalAdopters)
                .totalVendors(totalVendors)
                .pendingReports(pendingReports)
                .build();
    }

    // PERFORMANCE: Added pagination to avoid loading all users at once
    // Returns DTOs to avoid lazy-loading blob issues during JSON serialization
    @Transactional(readOnly = true)
    public Page<AdminUserDto> getAllUsers(Pageable pageable) {
        return userRepository.findAll(pageable).map(user -> AdminUserDto.builder()
                .id(user.getId())
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .userType(user.getUserType())
                .phoneNumber(user.getPhoneNumber())
                .emailNotificationsEnabled(user.getEmailNotificationsEnabled())
                .deletionRequested(user.getDeletionRequested())
                .deletionRequestedAt(user.getDeletionRequestedAt())
                .createdAt(user.getCreatedAt())
                .updatedAt(user.getUpdatedAt())
                .build());
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

        // Clean up dependent rows that are not cascaded from User
        petInteractionRepository.deleteByUser_Id(id);
        petInteractionRepository.deleteByPet_User_Id(id);
        userPreferenceRepository.deleteByUser_Id(id);
        passwordResetTokenRepository.deleteByUserId(id);

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

        // Clean up related records before deleting the pet
        try {
            imageService.deleteImagesByPet(id);
        } catch (java.io.IOException e) {
            log.error("Failed to delete images for pet {}: {}", id, e.getMessage());
        }
        petDocumentsService.deleteDocumentsByPet(id);
        petInteractionRepository.deleteByPet_Id(id);
        reportRepository.deleteByPetId(id);

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
