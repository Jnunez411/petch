package project.petch.petch_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.admin.AdminStatsDto;
import project.petch.petch_api.service.AdminService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public ResponseEntity<AdminStatsDto> getStats() {
        return ResponseEntity.ok(adminService.getStats());
    }

    // PERFORMANCE: Added pagination to avoid loading all users at once
    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllUsers(pageable));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        try {
            adminService.deleteUser(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            // User not found
            return ResponseEntity.notFound().build();
        } catch (IllegalStateException e) {
            // Cannot delete self
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    // PERFORMANCE: Added pagination to avoid loading all pets at once
    @GetMapping("/pets")
    public ResponseEntity<?> getAllPets(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(adminService.getAllPets(pageable));
    }

    @DeleteMapping("/pets/{id}")
    public ResponseEntity<?> deletePet(@PathVariable Long id) {
        try {
            adminService.deletePet(id);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            // Pet not found
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/audit-logs")
    public ResponseEntity<?> getAuditLogs() {
        return ResponseEntity.ok(adminService.getRecentAuditLogs());
    }
}
