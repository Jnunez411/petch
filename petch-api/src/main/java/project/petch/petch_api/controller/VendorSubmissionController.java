package project.petch.petch_api.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import lombok.RequiredArgsConstructor;
import project.petch.petch_api.dto.pet.AdoptionAppointmentDTO;
import project.petch.petch_api.dto.pet.AdoptionFormSubmissionDTO;
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.AdoptionAppointmentService;
import project.petch.petch_api.service.AdoptionFormSubmissionService;

@RestController
@RequestMapping("/api/v1/vendor/submissions")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR')")
public class VendorSubmissionController {
    private final AdoptionFormSubmissionService submissionService;
    private final AdoptionAppointmentService appointmentService;

    @GetMapping("/me")
    public ResponseEntity<List<AdoptionFormSubmissionDTO>> getMyVendorSubmissions(@AuthenticationPrincipal User user){
        return ResponseEntity.ok(submissionService.getSubmissionsForVendor(user));
    }

    @DeleteMapping("/me/{submissionId}")
    public ResponseEntity<Void> deleteVendorSubmission(@PathVariable Long submissionId,@AuthenticationPrincipal User user){
        submissionService.deleteSubmissionForVendor(submissionId, user);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{submissionId}/accept")
    public ResponseEntity<AdoptionAppointmentDTO> acceptSubmission(
            @PathVariable Long submissionId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        AdoptionAppointmentDTO appointment = appointmentService.createAppointment(
                submissionId,
                body.get("appointmentType"),
                body.get("location"),
                body.get("date"),
                body.get("times"),
                body.get("paymentOption"),
                body.getOrDefault("additionalInfo", ""),
                user);

        return ResponseEntity.ok(appointment);
    }
}