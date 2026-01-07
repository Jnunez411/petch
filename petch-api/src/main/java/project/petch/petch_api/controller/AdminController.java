package project.petch.petch_api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.admin.AdminStatsDto;
import project.petch.petch_api.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        log.debug("Fetching admin dashboard stats");
        AdminStatsDto stats = adminService.getStats();
        log.debug("Admin stats retrieved: users={}, pets={}", stats.getTotalUsers(), stats.getTotalPets());
        return ResponseEntity.ok(stats);
    }

    // PERFORMANCE: Added pagination to avoid loading all users at once
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.debug("Admin fetching users: page={}, size={}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        log.warn("Admin attempting to delete user: id={}", id);
        try {
            adminService.deleteUser(id);
            log.info("Admin deleted user successfully: id={}", id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Admin delete user failed - not found: id={}", id);
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            log.warn("Admin delete user failed - self-delete attempt: id={}", id);
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PERFORMANCE: Added pagination to avoid loading all pets at once
    @GetMapping("/pets")
    public ResponseEntity<?> getAllPets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.debug("Admin fetching pets: page={}, size={}", page, size);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllPets(pageable));
    }

    @DeleteMapping("/pets/{id}")
    public ResponseEntity<?> deletePet(@PathVariable Long id) {
        log.warn("Admin attempting to delete pet: id={}", id);
        try {
            adminService.deletePet(id);
            log.info("Admin deleted pet successfully: id={}", id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Admin delete pet failed - not found: id={}", id);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        log.debug("Fetching admin audit logs");
        return ResponseEntity.ok(adminService.getRecentAuditLogs());
    }
}
