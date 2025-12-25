package project.petch.petch_api.controller;

import lombok.RequiredArgsConstructor;
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

    @GetMapping("/users")
    public ResponseEntity<?> getAllUsers() {
        return ResponseEntity.ok(adminService.getAllUsers());
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

    @GetMapping("/pets")
    public ResponseEntity<?> getAllPets() {
        return ResponseEntity.ok(adminService.getAllPets());
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
