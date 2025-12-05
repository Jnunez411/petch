package project.petch.petch_api.dto.user;

import lombok.*;
import jakarta.validation.constraints.*;

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

    @Size(max = 100)
    private String homeType;

    private Boolean yard;

    private Boolean fencedYard;

    @Size(max = 255)
    private String preferredSpecies;

    @Size(max = 255)
    private String preferredBreeds;

    private Integer minAge;

    private Integer maxAge;

    @Size(max = 1000)
    private String additionalNotes;

    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
