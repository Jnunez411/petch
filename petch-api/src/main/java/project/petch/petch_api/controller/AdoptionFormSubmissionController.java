package project.petch.petch_api.controller;

import java.io.IOException;
import java.util.List;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Objects;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import project.petch.petch_api.dto.pet.AdoptionFormSubmissionDTO;
import project.petch.petch_api.models.AdoptionFormSubmission;
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.AdoptionFormSubmissionService;

@RestController
@RequestMapping("/api/pets/{petId}/adoption-form-submissions")
@RequiredArgsConstructor
@Slf4j
public class AdoptionFormSubmissionController{
    private final AdoptionFormSubmissionService submissionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdoptionFormSubmissionDTO> submitAdoptionForm(@PathVariable Long petId,@RequestParam("file") MultipartFile file,@AuthenticationPrincipal User user) throws IOException {
        try{
            AdoptionFormSubmissionDTO submission = submissionService.submitForm(petId, file, user);
            return ResponseEntity.ok(submission);
        }catch(IllegalArgumentException exception) {
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    public ResponseEntity<List<AdoptionFormSubmissionDTO>> getSubmissionsForPet(@PathVariable Long petId,@AuthenticationPrincipal User user){
        try{
            if(user == null){
                return ResponseEntity.status(401).build();
            }
            return ResponseEntity.ok(submissionService.getAccessibleSubmissionsForPet(petId, user));
        }catch(IllegalArgumentException exception){
            return ResponseEntity.status(403).build();
        }
    }

    @GetMapping("/{submissionId}/download")
    public ResponseEntity<byte[]> downloadSubmission(@PathVariable Long petId,@PathVariable Long submissionId,@AuthenticationPrincipal User user){
        try{
            if(user == null){
                return ResponseEntity.status(401).build();
            }

            AdoptionFormSubmission submission = submissionService.getAccessibleSubmissionForPet(petId, submissionId, user);

            return ResponseEntity.ok()
                    .header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\"" + submission.getFileName() + "\"")
                    .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
                    .body(submission.getPdfData());
        }catch(IllegalArgumentException exception){
            return ResponseEntity.status(403).build();
        }
    }
}