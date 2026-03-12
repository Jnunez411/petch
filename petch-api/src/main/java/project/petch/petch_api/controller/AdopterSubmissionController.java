package project.petch.petch_api.controller;

import java.util.List;
import java.util.Objects;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import project.petch.petch_api.dto.pet.AdoptionFormSubmissionDTO;
import project.petch.petch_api.models.AdoptionFormSubmission;
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.AdoptionFormSubmissionService;

@RestController
@RequestMapping("/api/v1/adopter/submissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADOPTER')")
public class AdopterSubmissionController{
    private final AdoptionFormSubmissionService submissionService;

    @GetMapping("/me")
    public ResponseEntity<List<AdoptionFormSubmissionDTO>> getMySubmissions(
            @AuthenticationPrincipal User user){
        return ResponseEntity.ok(submissionService.getSubmissionsForAdopter(user));
    }

    @GetMapping("/me/{submissionId}/download")
    public ResponseEntity<byte[]> downloadMySubmission(
            @PathVariable Long submissionId,
            @AuthenticationPrincipal User user){
        AdoptionFormSubmission submission = submissionService.getSubmissionForAdopter(submissionId, user);

        return ResponseEntity.ok().header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\"" + submission.getFileName() + "\"")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
                .body(submission.getPdfData());
    }
}