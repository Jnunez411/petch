package project.petch.petch_api.dto.report;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record ResolveReportRequest(
        @NotNull(message = "Status is required") String status,

        @Size(max = 500, message = "Admin notes must not exceed 500 characters") String adminNotes) {
}
