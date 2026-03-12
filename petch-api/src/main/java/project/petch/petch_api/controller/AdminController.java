package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.admin.AdminStatsDto;
import project.petch.petch_api.dto.report.ResolveReportRequest;
import project.petch.petch_api.service.AdminService;
import project.petch.petch_api.service.ReportService;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
@Slf4j
public class AdminController {

    private final AdminService adminService;
    private final ReportService reportService;

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

    @GetMapping("/reports")
    public ResponseEntity<?> getReports(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        log.debug("Admin fetching reports: status={}, page={}, size={}", status, page, size);
        Pageable pageable = PageRequest.of(page, size);
        return ResponseEntity.ok(reportService.getReports(status, pageable));
    }

    @GetMapping("/reports/{id}")
    public ResponseEntity<?> getReport(@PathVariable Long id) {
        log.debug("Admin fetching report: id={}", id);
        try {
            return ResponseEntity.ok(reportService.getReportById(id));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PutMapping("/reports/{id}/resolve")
    public ResponseEntity<?> resolveReport(
            @PathVariable Long id,
            @Valid @RequestBody ResolveReportRequest request) {
        log.info("Admin resolving report: id={}, status={}", id, request.status());
        try {
            return ResponseEntity.ok(reportService.resolveReport(id, request));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", e.getMessage()));
        }
    }
}
