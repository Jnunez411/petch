package project.petch.petch_api.dto.user;

import lombok.*;
import jakarta.validation.constraints.*;
import project.petch.petch_api.models.HomeType;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdopterProfileDTO {
    private Long id;

    private Integer householdSize;

    private Boolean hasChildren;

    private Boolean hasOtherPets;

    private HomeType homeType;

    private Boolean yard;

    private Boolean fencedYard;

    @Size(max = 1000)
    private String additionalNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
