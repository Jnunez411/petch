package project.petch.petch_api.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ReportDTO {
    private Long id;
    private Long petId;
    private String petName;
    private String petSpecies;
    private String petBreed;
    private Long reporterId;
    private String reporterEmail;
    private String reporterName;
    private Set<String> reasons;
    private String additionalDetails;
    private String status;
    private String adminNotes;
    private LocalDateTime createdAt;
    private LocalDateTime resolvedAt;
}
