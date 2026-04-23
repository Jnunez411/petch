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
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.AdoptionAppointmentService;

@RestController
@RequestMapping("/api/v1/adopter/appointments")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADOPTER')")
public class AdopterAppointmentController {

    private final AdoptionAppointmentService appointmentService;

    @GetMapping("/me")
    public ResponseEntity<List<AdoptionAppointmentDTO>> getMyAppointments(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(appointmentService.getAppointmentsForAdopter(user));
    }

    @PostMapping("/{appointmentId}/select-time")
    public ResponseEntity<AdoptionAppointmentDTO> selectTime(
            @PathVariable Long appointmentId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal User user) {

        String selectedTime = body.get("selectedTime");
        if (selectedTime == null || selectedTime.isBlank()) {
            return ResponseEntity.badRequest().build();
        }

        return ResponseEntity.ok(appointmentService.selectTime(appointmentId, selectedTime, user));
    }

    @DeleteMapping("/{appointmentId}/reject")
    public ResponseEntity<Void> rejectAppointment(
            @PathVariable Long appointmentId,
            @AuthenticationPrincipal User user) {
        appointmentService.rejectAppointment(appointmentId, user);
        return ResponseEntity.noContent().build();
    }
}
