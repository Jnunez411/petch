package project.petch.petch_api.dto.pet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.*;
import java.util.List;
import project.petch.petch_api.dto.ImageDTO;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetDTO{
    private Long id;

    @NotBlank(message = "Name is Required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    private String name;

    @NotBlank(message = "Species is Required")
    @Size(min = 2, max = 50, message = "Species must be 2-50 characters")
    private String species;

    @NotBlank(message = "Breed is Required")
    @Size(min = 2, max = 100, message = "Breed must be 2-100 characters")
    private String breed;

    @NotNull(message = "Age is Required")
    @Max(value = 30, message = "Age must be realistic (under 60)")
    @Min(value = 0, message = "Age must be zero or positive")
    private Integer age;

    private String description = null;

    private Boolean atRisk = false;

    private Boolean fosterable = false;

    private Long userId;

    private List<ImageDTO> images;
}