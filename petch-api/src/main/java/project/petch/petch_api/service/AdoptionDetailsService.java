package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import project.petch.petch_api.dto.pet.AdoptionDetailsDTO;
import project.petch.petch_api.exception.ResourceNotFoundException;
import project.petch.petch_api.models.AdoptionDetails;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.AdoptionDetailsRepository;
import project.petch.petch_api.repositories.PetsRepository;

import java.io.IOException;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class AdoptionDetailsService {
    private final AdoptionDetailsRepository adoptionDetailsRepository;
    private final PetsRepository petsRepository;

    public AdoptionDetailsDTO getAdoptionDetails(Long petId) {
        AdoptionDetails adoptionDetails = adoptionDetailsRepository.findByPetId(petId)
                .orElseThrow(() -> new ResourceNotFoundException("Adoption details not found for pet: " + petId));
        return mapToDTO(adoptionDetails);
    }

    public AdoptionDetailsDTO createAdoptionDetails(Long petId, AdoptionDetailsDTO dto) {
        Pets pet = petsRepository.findById(petId)
                .orElseThrow(() -> new ResourceNotFoundException("Pet not found with id: " + petId));

        if (adoptionDetailsRepository.findByPetId(petId).isPresent()) {
            throw new IllegalArgumentException("Adoption details already exist for this pet");
        }

        AdoptionDetails adoptionDetails = mapToEntity(dto);
        adoptionDetails.setPet(pet);

        AdoptionDetails saved = adoptionDetailsRepository.save(adoptionDetails);
        return mapToDTO(saved);
    }

    public AdoptionDetailsDTO updateAdoptionDetails(Long petId, AdoptionDetailsDTO dto) {
        AdoptionDetails adoptionDetails = adoptionDetailsRepository.findByPetId(petId)
                .orElseThrow(() -> new ResourceNotFoundException("Adoption details not found for pet: " + petId));

        if (dto.getIsDirect() != null) {
            adoptionDetails.setIsDirect(dto.getIsDirect());
        }
        if (dto.getPriceEstimate() != null) {
            adoptionDetails.setPriceEstimate(dto.getPriceEstimate());
        }
        if (dto.getStepsDescription() != null) {
            adoptionDetails.setStepsDescription(dto.getStepsDescription());
        }
        if (dto.getRedirectLink() != null) {
            adoptionDetails.setRedirectLink(dto.getRedirectLink());
        }
        if (dto.getPhoneNumber() != null) {
            adoptionDetails.setPhoneNumber(dto.getPhoneNumber());
        }
        if (dto.getEmail() != null) {
            adoptionDetails.setEmail(dto.getEmail());
        }

        AdoptionDetails updated = adoptionDetailsRepository.save(adoptionDetails);
        return mapToDTO(updated);
    }

    public void deleteAdoptionDetails(Long petId) {
        AdoptionDetails adoptionDetails = adoptionDetailsRepository.findByPetId(petId)
                .orElseThrow(() -> new ResourceNotFoundException("Adoption details not found for pet, it is now homeless: " + petId));
        adoptionDetailsRepository.delete(adoptionDetails);
    }

    @Transactional(readOnly = true)
    public AdoptionDetails getOnlineFormTemplateForPet(Long petId){
        AdoptionDetails adoptionDetails = adoptionDetailsRepository.findByPetId(petId).orElseThrow(() -> new ResourceNotFoundException("Adoption details not found for pet: " + petId));

        if(adoptionDetails.getOnlineFormPdf() == null || adoptionDetails.getOnlineFormPdf().length == 0) {
            throw new ResourceNotFoundException("Online form template not found for pet, its gettin put down now (RIP): " + petId);
        }
        return adoptionDetails;
    }

    public AdoptionDetailsDTO uploadOnlineFormPdf(Long petId, MultipartFile file, User user) throws IOException {
        AdoptionDetails adoptionDetails = adoptionDetailsRepository.findByPetId(petId).orElseThrow(() -> new ResourceNotFoundException("Adoption details not found for pet, it is now homeless: " + petId));

        Pets pet = adoptionDetails.getPet();
        if(user == null){
            throw new IllegalArgumentException("User must be authenticated, STOP BREAKIN IN");
        }

        boolean isAdmin = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean ownsPet = pet != null && pet.getUser() != null && pet.getUser().getId().equals(user.getId());

        if(!isAdmin && !ownsPet){
            throw new IllegalArgumentException("You do not have access to upload an adoption form for this pet, this shouldnt even be possible");
        }

        validatePdfFile(file);

        adoptionDetails.setOnlineFormPdf(file.getBytes());
        adoptionDetails.setOnlineFormFileName(file.getOriginalFilename());
        adoptionDetails.setOnlineFormContentType(file.getContentType());

        return mapToDTO(adoptionDetailsRepository.save(adoptionDetails));
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
                .hasOnlineFormPdf(adoptionDetails.getOnlineFormPdf() != null && adoptionDetails.getOnlineFormPdf().length > 0)
                .onlineFormFileName(adoptionDetails.getOnlineFormFileName())
                .onlineFormContentType(adoptionDetails.getOnlineFormContentType())
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

    private void validatePdfFile(MultipartFile file){
        if(file == null || file.isEmpty()){
            throw new IllegalArgumentException("PDF file cannot be empty, please upload a valid PDF file");
        }

        if(file.getSize() > 10 * 1024 * 1024){ // 10MB limit
            throw new IllegalArgumentException("PDF file size exceeds maximum allowed (10MB), yo shi too big dawg");
        }

        String contentType = file.getContentType();
        String originalFilenameValue = file.getOriginalFilename();
        String originalFilename = originalFilenameValue == null ? "" : originalFilenameValue.toLowerCase();

        if(!Objects.equals("application/pdf", contentType) && !originalFilename.endsWith(".pdf")){
            throw new IllegalArgumentException("File must be a PDF, we dont want no weird shi");
        }
    }
}
