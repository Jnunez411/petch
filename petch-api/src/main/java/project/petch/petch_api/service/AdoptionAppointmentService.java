package project.petch.petch_api.service;

import java.time.LocalDate;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import project.petch.petch_api.dto.pet.AdoptionAppointmentDTO;
import project.petch.petch_api.exception.ResourceNotFoundException;
import project.petch.petch_api.models.AdoptionAppointment;
import project.petch.petch_api.models.AdoptionAppointment.AppointmentStatus;
import project.petch.petch_api.models.AdoptionAppointment.AppointmentType;
import project.petch.petch_api.models.AdoptionAppointment.PaymentOption;
import project.petch.petch_api.models.AdoptionFormSubmission;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.AdoptionAppointmentRepository;
import project.petch.petch_api.repositories.AdoptionFormSubmissionRepository;
import project.petch.petch_api.repositories.PetsRepository;

@Service
@RequiredArgsConstructor
@Transactional
public class AdoptionAppointmentService {

    private final AdoptionAppointmentRepository appointmentRepository;
    private final AdoptionFormSubmissionRepository submissionRepository;
    private final PetsRepository petsRepository;

    public AdoptionAppointmentDTO createAppointment(
            Long submissionId,
            String appointmentType,
            String location,
            String date,
            String availableTimes,
            String paymentOption,
            String additionalInfo,
            User vendor) {

        if (vendor == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }

        AdoptionFormSubmission submission = submissionRepository.findById(submissionId)
                .orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        // Verify vendor owns the pet
        if (!submission.getPet().getUser().getId().equals(vendor.getId())) {
            throw new IllegalArgumentException("You do not have access to this submission");
        }

        AdoptionAppointment appointment = AdoptionAppointment.builder()
                .submission(submission)
                .pet(submission.getPet())
                .adopterUser(submission.getAdopterUser())
                .vendorUser(vendor)
                .appointmentType(AppointmentType.valueOf(appointmentType))
                .location(location)
                .appointmentDate(LocalDate.parse(date))
                .availableTimes(availableTimes)
                .paymentOption(PaymentOption.valueOf(paymentOption))
                .additionalInfo(additionalInfo)
                .status(AppointmentStatus.PENDING)
                .build();

        AdoptionAppointmentDTO result = toDTO(appointmentRepository.save(appointment));

        // Put the pet on hold — removes it from public listings
        submission.getPet().setOnHold(true);
        petsRepository.save(submission.getPet());

        // Remove all OTHER submissions for this pet (keep the accepted one)
        submissionRepository.findByPetIdOrderByCreatedAtDesc(submission.getPet().getId())
                .stream()
                .filter(s -> !s.getId().equals(submissionId))
                .forEach(submissionRepository::delete);

        return result;
    }

    @Transactional(readOnly = true)
    public List<AdoptionAppointmentDTO> getAppointmentsForAdopter(User adopter) {
        if (adopter == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }
        return appointmentRepository.findByAdopterUserIdOrderByCreatedAtDesc(adopter.getId())
                .stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AdoptionAppointmentDTO> getAppointmentsForVendor(User vendor) {
        if (vendor == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }
        return appointmentRepository.findByVendorUserIdOrderByCreatedAtDesc(vendor.getId())
                .stream().map(this::toDTO).toList();
    }

    public AdoptionAppointmentDTO vendorConfirm(Long appointmentId, User vendor) {
        if (vendor == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }

        AdoptionAppointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getVendorUser().getId().equals(vendor.getId())) {
            throw new IllegalArgumentException("You do not have access to this appointment");
        }

        appointment.setVendorConfirmed(true);
        appointment.setSubmission(null); // allow submission cleanup
        appointmentRepository.save(appointment);

        // Delete all submission forms for this pet now that appointment is fully confirmed
        submissionRepository.findByPetIdOrderByCreatedAtDesc(appointment.getPet().getId())
                .forEach(submissionRepository::delete);

        return toDTO(appointment);
    }

    public void rejectAppointment(Long appointmentId, User adopter) {
        if (adopter == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }

        AdoptionAppointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getAdopterUser().getId().equals(adopter.getId())) {
            throw new IllegalArgumentException("You do not have access to this appointment");
        }

        // Release the pet from on-hold
        appointment.getPet().setOnHold(false);
        petsRepository.save(appointment.getPet());

        appointmentRepository.delete(appointment);
    }

    public void vendorCancel(Long appointmentId, User vendor) {
        if (vendor == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }

        AdoptionAppointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getVendorUser().getId().equals(vendor.getId())) {
            throw new IllegalArgumentException("You do not have access to this appointment");
        }

        // Release the pet from on-hold
        appointment.getPet().setOnHold(false);
        petsRepository.save(appointment.getPet());

        appointmentRepository.delete(appointment);
    }

    public AdoptionAppointmentDTO selectTime(Long appointmentId, String selectedTime, User adopter) {
        if (adopter == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }

        AdoptionAppointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getAdopterUser().getId().equals(adopter.getId())) {
            throw new IllegalArgumentException("You do not have access to this appointment");
        }

        appointment.setSelectedTime(selectedTime);
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        return toDTO(appointmentRepository.save(appointment));
    }

    public AdoptionAppointmentDTO vendorSelectTime(Long appointmentId, String selectedTime, User vendor) {
        if (vendor == null) {
            throw new IllegalArgumentException("User must be authenticated");
        }

        AdoptionAppointment appointment = appointmentRepository.findById(appointmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Appointment not found"));

        if (!appointment.getVendorUser().getId().equals(vendor.getId())) {
            throw new IllegalArgumentException("You do not have access to this appointment");
        }

        appointment.setSelectedTime(selectedTime);
        appointment.setVendorConfirmed(true); // Vendor chose it — implicitly confirmed
        appointment.setStatus(AppointmentStatus.CONFIRMED);
        appointment.setSubmission(null); 
        appointmentRepository.save(appointment);

        // Delete all submission forms for this pet now that appointment is fully confirmed
        submissionRepository.findByPetIdOrderByCreatedAtDesc(appointment.getPet().getId())
                .forEach(submissionRepository::delete);

        return toDTO(appointment);
    }

    private AdoptionAppointmentDTO toDTO(AdoptionAppointment a) {
        return AdoptionAppointmentDTO.builder()
                .id(a.getId())
                .submissionId(a.getSubmission() != null ? a.getSubmission().getId() : null)
                .petId(a.getPet().getId())
                .petName(a.getPet().getName())
                .adopterUserId(a.getAdopterUser().getId())
                .adopterEmail(a.getAdopterUser().getEmail())
                .vendorUserId(a.getVendorUser().getId())
                .appointmentType(a.getAppointmentType())
                .location(a.getLocation())
                .appointmentDate(a.getAppointmentDate())
                .availableTimes(a.getAvailableTimes())
                .paymentOption(a.getPaymentOption())
                .additionalInfo(a.getAdditionalInfo())
                .selectedTime(a.getSelectedTime())
                .status(a.getStatus())
                .vendorConfirmed(a.getVendorConfirmed())
                .createdAt(a.getCreatedAt())
                .build();
    }
}
