package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.petch.petch_api.dto.pet.AdoptionDetailsDTO;
import project.petch.petch_api.exception.ResourceNotFoundException;
import project.petch.petch_api.models.AdoptionDetails;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.repositories.AdoptionDetailsRepository;
import project.petch.petch_api.repositories.PetsRepository;

@Service
@RequiredArgsConstructor
@Transactional
public class AdoptionDetailsService{
    private final AdoptionDetailsRepository adoptionDetailsRepository;
    private final PetsRepository petsRepository;

    public AdoptionDetailsDTO getAdoptionDetails(Long petId){
        AdoptionDetails adoptionDetails = adoptionDetailsRepository.findByPetId(petId).orElseThrow(() -> new ResourceNotFoundException("Adoption details not found for pet: " + petId));
        return mapToDTO(adoptionDetails);
    }

    public AdoptionDetailsDTO createAdoptionDetails(Long petId, AdoptionDetailsDTO dto) {
        Pets pet = petsRepository.findById(petId).orElseThrow(() -> new ResourceNotFoundException("Pet not found with id: " + petId));

        if(adoptionDetailsRepository.findByPetId(petId).isPresent()){
            throw new IllegalArgumentException("Adoption details already exist for this pet");
        }

        AdoptionDetails adoptionDetails = mapToEntity(dto);
        adoptionDetails.setPet(pet);

        AdoptionDetails saved = adoptionDetailsRepository.save(adoptionDetails);
        return mapToDTO(saved);
    }

    public AdoptionDetailsDTO updateAdoptionDetails(Long petId, AdoptionDetailsDTO dto){
        AdoptionDetails adoptionDetails = adoptionDetailsRepository.findByPetId(petId).orElseThrow(() -> new ResourceNotFoundException("Adoption details not found for pet: " + petId));

        if(dto.getIsDirect() != null){
            adoptionDetails.setIsDirect(dto.getIsDirect());
        }
        if(dto.getPriceEstimate() != null){
            adoptionDetails.setPriceEstimate(dto.getPriceEstimate());
        }
        if(dto.getStepsDescription() != null){
            adoptionDetails.setStepsDescription(dto.getStepsDescription());
        }
        if(dto.getRedirectLink() != null){
            adoptionDetails.setRedirectLink(dto.getRedirectLink());
        }
        if(dto.getPhoneNumber() != null){
            adoptionDetails.setPhoneNumber(dto.getPhoneNumber());
        }
        if(dto.getEmail() != null){
            adoptionDetails.setEmail(dto.getEmail());
        }

        AdoptionDetails updated = adoptionDetailsRepository.save(adoptionDetails);
        return mapToDTO(updated);
    }

    public void deleteAdoptionDetails(Long petId) {
        AdoptionDetails adoptionDetails = adoptionDetailsRepository.findByPetId(petId).orElseThrow(() -> new ResourceNotFoundException("Adoption details not found for pet: " + petId));
        adoptionDetailsRepository.delete(adoptionDetails);
    }

    private AdoptionDetailsDTO mapToDTO(AdoptionDetails adoptionDetails) {
        return AdoptionDetailsDTO.builder()
                .id(adoptionDetails.getId())
                .isDirect(adoptionDetails.getIsDirect())
                .priceEstimate(adoptionDetails.getPriceEstimate())
                .stepsDescription(adoptionDetails.getStepsDescription())
                .redirectLink(adoptionDetails.getRedirectLink())
                .phoneNumber(adoptionDetails.getPhoneNumber())
                .email(adoptionDetails.getEmail())
                .build();
    }

    private AdoptionDetails mapToEntity(AdoptionDetailsDTO dto) {
        return AdoptionDetails.builder()
                .isDirect(dto.getIsDirect())
                .priceEstimate(dto.getPriceEstimate())
                .stepsDescription(dto.getStepsDescription())
                .redirectLink(dto.getRedirectLink())
                .phoneNumber(dto.getPhoneNumber())
                .email(dto.getEmail())
                .build();
    }
}
