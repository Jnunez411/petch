package project.petch.petch_api.dto.pet;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetOwnerDTO{
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private String userType;
}