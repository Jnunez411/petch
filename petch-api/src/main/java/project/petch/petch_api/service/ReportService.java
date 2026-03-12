package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.petch.petch_api.dto.report.ReportDTO;
import project.petch.petch_api.dto.report.ReportRequest;
import project.petch.petch_api.dto.report.ResolveReportRequest;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.Report;
import project.petch.petch_api.models.ReportReason;
import project.petch.petch_api.models.ReportStatus;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.PetsRepository;
import project.petch.petch_api.repositories.ReportRepository;

import java.time.LocalDateTime;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReportService {

    private final ReportRepository reportRepository;
    private final PetsRepository petsRepository;

    @Transactional
    public ReportDTO createReport(User reporter, ReportRequest request) {
        // Check if user already reported this pet
        if (reportRepository.existsByReporterAndPetId(reporter, request.petId())) {
            throw new IllegalStateException("You have already reported this listing");
        }

        Pets pet = petsRepository.findById(request.petId())
                .orElseThrow(() -> new IllegalArgumentException("Pet not found with ID: " + request.petId()));

        // Parse reasons from strings to enum values
        Set<ReportReason> reasons = request.reasons().stream()
                .map(r -> {
                    try {
                        return ReportReason.valueOf(r);
                    } catch (IllegalArgumentException e) {
                        throw new IllegalArgumentException("Invalid report reason: " + r);
                    }
                })
                .collect(Collectors.toSet());

        Report report = Report.builder()
                .reporter(reporter)
                .pet(pet)
                .reasons(reasons)
                .additionalDetails(request.additionalDetails())
                .status(ReportStatus.PENDING)
                .build();

        Report saved = reportRepository.save(report);
        log.info("Report created: id={}, petId={}, reporter={}", saved.getId(), pet.getId(), reporter.getEmail());

        return toDTO(saved);
    }

    public Page<ReportDTO> getReports(String status, Pageable pageable) {
        Page<Report> reports;
        if (status != null && !status.isEmpty()) {
            try {
                ReportStatus reportStatus = ReportStatus.valueOf(status);
                reports = reportRepository.findByStatus(reportStatus, pageable);
            } catch (IllegalArgumentException e) {
                throw new IllegalArgumentException("Invalid status: " + status);
            }
        } else {
            reports = reportRepository.findAllByOrderByCreatedAtDesc(pageable);
        }
        return reports.map(this::toDTO);
    }

    public ReportDTO getReportById(Long id) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with ID: " + id));
        return toDTO(report);
    }

    @Transactional
    public ReportDTO resolveReport(Long id, ResolveReportRequest request) {
        Report report = reportRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Report not found with ID: " + id));

        ReportStatus newStatus;
        try {
            newStatus = ReportStatus.valueOf(request.status());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid status: " + request.status());
        }

        report.setStatus(newStatus);
        report.setAdminNotes(request.adminNotes());
        report.setResolvedAt(LocalDateTime.now());

        Report saved = reportRepository.save(report);
        log.info("Report resolved: id={}, status={}", saved.getId(), newStatus);

        return toDTO(saved);
    }

    public long countByStatus(ReportStatus status) {
        return reportRepository.countByStatus(status);
    }

    private ReportDTO toDTO(Report report) {
        User reporter = report.getReporter();
        Pets pet = report.getPet();

        return ReportDTO.builder()
                .id(report.getId())
                .petId(pet.getId())
                .petName(pet.getName())
                .petSpecies(pet.getSpecies())
                .petBreed(pet.getBreed())
                .reporterId(reporter.getId())
                .reporterEmail(reporter.getEmail())
                .reporterName(reporter.getFirstName() + " " + reporter.getLastName())
                .reasons(report.getReasons().stream().map(Enum::name).collect(Collectors.toSet()))
                .additionalDetails(report.getAdditionalDetails())
                .status(report.getStatus().name())
                .adminNotes(report.getAdminNotes())
                .createdAt(report.getCreatedAt())
                .resolvedAt(report.getResolvedAt())
                .build();
    }
}
