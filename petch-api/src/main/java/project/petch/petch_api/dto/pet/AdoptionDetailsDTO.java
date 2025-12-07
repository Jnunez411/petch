package project.petch.petch_api.dto.pet;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdoptionDetailsDTO {
    private Long id;

    private Boolean isDirect;

    private Double priceEstimate;

    private String stepsDescription;

    private String redirectLink;

    private String phoneNumber;

    private String email;
}
