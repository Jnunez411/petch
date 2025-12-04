package project.petch.petch_api.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ImageDTO {
    private Long id;

    @NotBlank(message = "File path is required")
    private String filePath;

    private String altText;

    private Long fileSize;

    private LocalDateTime createdAt;
}
