package project.petch.petch_api.dto.pet;

import java.time.LocalDate;
import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.petch.petch_api.models.AdoptionAppointment.AppointmentStatus;
import project.petch.petch_api.models.AdoptionAppointment.AppointmentType;
import project.petch.petch_api.models.AdoptionAppointment.PaymentOption;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdoptionAppointmentDTO {
    private Long id;
    private Long submissionId;
    private Long petId;
    private String petName;
    private Long adopterUserId;
    private String adopterEmail;
    private Long vendorUserId;
    private AppointmentType appointmentType;
    private String location;
    private LocalDate appointmentDate;
    private String availableTimes;
    private PaymentOption paymentOption;
    private String additionalInfo;
    private String selectedTime;
    private AppointmentStatus status;
    private Boolean vendorConfirmed;
    private LocalDateTime createdAt;
}
