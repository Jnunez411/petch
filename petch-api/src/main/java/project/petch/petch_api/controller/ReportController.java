package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.report.ReportDTO;
import project.petch.petch_api.dto.report.ReportRequest;
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.ReportService;

import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Slf4j
public class ReportController {

    private final ReportService reportService;

    @PostMapping
    public ResponseEntity<?> createReport(
            @AuthenticationPrincipal User user,
            @Valid @RequestBody ReportRequest request) {
        log.info("User {} submitting report for pet {}", user.getEmail(), request.petId());
        try {
            ReportDTO report = reportService.createReport(user, request);
            return ResponseEntity.status(HttpStatus.CREATED).body(report);
        } catch (IllegalStateException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", e.getMessage()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
