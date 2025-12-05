package project.petch.petch_api.dto.user;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorProfileDTO {

    private Long id;

    @NotBlank(message = "Organization name is required")
    private String organizationName;

    private String websiteUrl;

    private String phoneNumber;

    private String city;

    private String state;

    private String description;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}
