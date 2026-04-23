package project.petch.petch_api.dto.pet;

import java.time.LocalDateTime;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetDocumentFileDTO{
    private Long id;
    private String fileName;
    private String contentType;
    private Long fileSize;
    private LocalDateTime createdAt;
}