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
public class AdoptionFormSubmissionDTO{
    private Long id;
    private Long petId;
    private String petName;
    private Long adopterUserId;
    private String adopterName;
    private String adopterEmail;
    private String fileName;
    private String contentType;
    private LocalDateTime createdAt;
}