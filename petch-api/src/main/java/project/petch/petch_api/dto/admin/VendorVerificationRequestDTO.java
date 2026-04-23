package project.petch.petch_api.dto.admin;

import lombok.Builder;
import project.petch.petch_api.models.VerificationRequestStatus;

import java.time.LocalDateTime;

@Builder
public record VendorVerificationRequestDTO(
        Long verificationRequestId,
        Long vendorProfileId,
        Long userId,
        String organizationName,
        String contactEmail,
        String city,
        String state,
        LocalDateTime submittedAt,
        String reviewedBy,
        LocalDateTime reviewedAt,
        String rejectionReason,
        String supportingMetadata,
        VerificationRequestStatus requestStatus
) {
}