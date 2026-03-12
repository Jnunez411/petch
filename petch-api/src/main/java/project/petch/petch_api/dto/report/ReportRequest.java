package project.petch.petch_api.dto.report;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record ReportRequest(
        @NotNull(message = "Pet ID is required") Long petId,

        @NotEmpty(message = "At least one reason is required") Set<String> reasons,

        @Size(max = 500, message = "Additional details must not exceed 500 characters") String additionalDetails) {
}
