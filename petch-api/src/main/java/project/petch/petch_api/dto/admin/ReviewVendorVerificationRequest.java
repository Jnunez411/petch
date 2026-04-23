package project.petch.petch_api.dto.admin;

import jakarta.validation.constraints.NotNull;
import project.petch.petch_api.models.VerificationRequestStatus;

public record ReviewVendorVerificationRequest(
        @NotNull(message = "status is required") VerificationRequestStatus status,
        String rejectionReason
) {
}