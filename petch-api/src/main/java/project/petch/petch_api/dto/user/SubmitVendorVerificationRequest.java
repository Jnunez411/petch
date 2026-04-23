package project.petch.petch_api.dto.user;

import jakarta.validation.constraints.Size;

public record SubmitVendorVerificationRequest(
        @Size(max = 4000, message = "supportingMetadata must not exceed 4000 characters")
        String supportingMetadata
) {
}
