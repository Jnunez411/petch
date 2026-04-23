package project.petch.petch_api.dto.pet;

import java.util.List;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetDocumentsDTO{
    private Long petId;
    private List<PetDocumentFileDTO> documents;
}