package project.petch.petch_api.dto.pet;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import lombok.*;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetDTO {
    private Long id;

    @NotBlank(message = "Name is Required")
    @Size(min = 2, max = 100, message = "Name must be 2-100 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-']+$", message = "Name can only contain letters, numbers, spaces, hyphens, and apostrophes")
    private String name;

    @NotBlank(message = "Species is Required")
    @Size(min = 2, max = 50, message = "Species must be 2-50 characters")
    @Pattern(regexp = "^[a-zA-Z\\s\\-]+$", message = "Species can only contain letters, spaces, and hyphens")
    private String species;

    @NotBlank(message = "Breed is Required")
    @Size(min = 2, max = 100, message = "Breed must be 2-100 characters")
    @Pattern(regexp = "^[a-zA-Z0-9\\s\\-']+$", message = "Breed can only contain letters, numbers, spaces, hyphens, and apostrophes")
    private String breed;

    @NotNull(message = "Age is Required")
    @Max(value = 30, message = "Age must be realistic (under 30)")
    @Min(value = 0, message = "Age must be zero or positive")
    private Integer age;

    @Size(max = 2000, message = "Description must not exceed 2000 characters")
    @Pattern(regexp = "^[^<>]*$", message = "Description cannot contain < or > characters")
    private String description = null;

    @Builder.Default
    private Boolean atRisk = false;

    @Builder.Default
    private Boolean fosterable = false;

    private Long userId;

    private List<ImageDTO> images;
}