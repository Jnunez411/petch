package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import project.petch.petch_api.dto.user.VendorAdoptionPreferencesDTO;
import project.petch.petch_api.exception.ResourceNotFoundException;
import project.petch.petch_api.models.VendorAdoptionPreferences;
import project.petch.petch_api.models.VendorProfile;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.repositories.VendorAdoptionPreferencesRepository;
import project.petch.petch_api.repositories.VendorProfileRepository;
import project.petch.petch_api.repositories.PetsRepository;

import java.io.IOException;
import java.util.Objects;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class VendorAdoptionPreferencesService{
    private final VendorAdoptionPreferencesRepository repository;
    private final VendorProfileRepository vendorProfileRepository;
    private final PetsRepository petsRepository;

    @Transactional(readOnly = true)
    public Optional<VendorAdoptionPreferences> findById(Long id){
        return repository.findById(id);
    }

    @Transactional(readOnly = true)
    public Optional<VendorAdoptionPreferencesDTO> getByUserId(Long userId){
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        return repository.findByVendorProfileUserId(nonNullUserId).map(this::toDTO);
    }

    @Transactional
    public VendorAdoptionPreferencesDTO createForUserId(Long userId, VendorAdoptionPreferencesDTO dto){
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");

        if(repository.findByVendorProfileUserId(nonNullUserId).isPresent()) {
            throw new IllegalStateException("Vendor adoption preferences already exist for this user");
        }

        VendorProfile vendorProfile = vendorProfileRepository.findByUserId(nonNullUserId).orElseThrow(() -> new IllegalStateException("Vendor profile not found for user"));

        VendorAdoptionPreferences entity = new VendorAdoptionPreferences();
        entity.setVendorProfile(vendorProfile);
        entity.setPayOnline(false);
        mapDtoToEntity(dto, entity);

        return toDTO(repository.save(entity));
    }

    @Transactional
    public Optional<VendorAdoptionPreferencesDTO> updateForUserId(Long userId, VendorAdoptionPreferencesDTO dto){
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        return repository.findByVendorProfileUserId(nonNullUserId).map(existing -> {mapDtoToEntity(dto, existing);return toDTO(repository.save(existing));});
    }

    public void deleteById(Long id){
        repository.deleteById(id);
    }

    private void mapDtoToEntity(VendorAdoptionPreferencesDTO dto, VendorAdoptionPreferences entity){
        entity.setUseShelterLocation(dto.isUseShelterLocation());
        entity.setContactMethod(dto.getContactMethod());
        entity.setDirectLinkUrl(dto.getContactMethod() == VendorAdoptionPreferences.AdoptionContactMethod.DIRECT_LINK? dto.getDirectLinkUrl(): null);
        entity.setContactNumber(dto.getContactMethod() == VendorAdoptionPreferences.AdoptionContactMethod.CONTACT_NUMBER? dto.getContactNumber(): null);
        entity.setStepsDescription(dto.getStepsDescription());
        entity.setPhoneNumber(dto.getPhoneNumber());
        entity.setEmail(dto.getEmail());

        if(dto.getLongitude() != null || dto.getLatitude() != null){
            entity.setLongitude(dto.getLongitude());
            entity.setLatitude(dto.getLatitude());
        }

        if(dto.getPayOnline() != null){
            entity.setPayOnline(dto.getPayOnline());
        }
    }

    @Transactional
    public VendorAdoptionPreferencesDTO uploadOnlineFormPdfForUserId(Long userId, MultipartFile file) throws IOException {
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        VendorAdoptionPreferences preferences = repository.findByVendorProfileUserId(nonNullUserId).orElseThrow(() -> new ResourceNotFoundException("Vendor adoption preferences not found for user"));

        validatePdfFile(file);

        preferences.setOnlineFormPdf(file.getBytes());
        preferences.setOnlineFormFileName(file.getOriginalFilename());
        preferences.setOnlineFormContentType(file.getContentType());

        return toDTO(repository.save(preferences));
    }

    @Transactional
    public boolean deleteOnlineFormPdfForUserId(Long userId){
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        return repository.findByVendorProfileUserId(nonNullUserId).map(preferences -> {
            preferences.setOnlineFormPdf(null);
            preferences.setOnlineFormFileName(null);
            preferences.setOnlineFormContentType(null);
            repository.save(preferences);
            return true;
        }).orElse(false);
    }

    @Transactional(readOnly = true)
    public VendorAdoptionPreferences getOnlineFormTemplateForPet(Long petId){
        Pets pet = petsRepository.findById(petId).orElseThrow(() -> new ResourceNotFoundException("Pet not found with id: " + petId));

        // 1. Check if the pet has its own specific online form
        if (pet.getAdoptionDetails() != null && pet.getAdoptionDetails().getOnlineFormPdf() != null && pet.getAdoptionDetails().getOnlineFormPdf().length > 0) {
            VendorAdoptionPreferences syntheticPrefs = new VendorAdoptionPreferences();
            syntheticPrefs.setContactMethod(VendorAdoptionPreferences.AdoptionContactMethod.ONLINE_FORM);
            syntheticPrefs.setOnlineFormPdf(pet.getAdoptionDetails().getOnlineFormPdf());
            syntheticPrefs.setOnlineFormFileName(pet.getAdoptionDetails().getOnlineFormFileName());
            syntheticPrefs.setOnlineFormContentType(pet.getAdoptionDetails().getOnlineFormContentType());
            return syntheticPrefs;
        }

        // 2. Fall back to vendor's global preferences
        if(pet.getUser() == null){
            throw new ResourceNotFoundException("Pet does not belong to a vendor and has no specific adoption form");
        }

        VendorAdoptionPreferences preferences = repository.findByVendorProfileUserId(pet.getUser().getId()).orElseThrow(() -> new ResourceNotFoundException("Vendor adoption preferences not found for pet"));

        boolean hasTemplate = preferences.getContactMethod() == VendorAdoptionPreferences.AdoptionContactMethod.ONLINE_FORM && preferences.getOnlineFormPdf() != null && preferences.getOnlineFormPdf().length > 0;

        if(!hasTemplate){
            throw new ResourceNotFoundException("Online form template not found for pet (neither specific nor global)");
        }

        return preferences;
    }

    private void validatePdfFile(MultipartFile file){
        if(file == null || file.isEmpty()){
            throw new IllegalArgumentException("PDF file cannot be empty");
        }

        if(file.getSize() > 10 * 1024 * 1024){
            throw new IllegalArgumentException("PDF file size exceeds maximum allowed (10MB)");
        }

        String contentType = file.getContentType();
        String originalFilename = file.getOriginalFilename() == null ? "" : file.getOriginalFilename().toLowerCase();

        if(!"application/pdf".equalsIgnoreCase(contentType) && !originalFilename.endsWith(".pdf")){
            throw new IllegalArgumentException("File must be a PDF");
        }
    }

    private VendorAdoptionPreferencesDTO toDTO(VendorAdoptionPreferences entity){
        return VendorAdoptionPreferencesDTO.builder()
                .id(entity.getId())
                .useShelterLocation(entity.isUseShelterLocation())
                .longitude(entity.getLongitude())
                .latitude(entity.getLatitude())
                .contactMethod(entity.getContactMethod())
                .directLinkUrl(entity.getDirectLinkUrl())
                .contactNumber(entity.getContactNumber())
                .stepsDescription(entity.getStepsDescription())
                .phoneNumber(entity.getPhoneNumber())
                .email(entity.getEmail())
                .hasOnlineFormPdf(entity.getOnlineFormPdf() != null && entity.getOnlineFormPdf().length > 0)
                .onlineFormFileName(entity.getOnlineFormFileName())
                .onlineFormContentType(entity.getOnlineFormContentType())
                .payOnline(entity.getPayOnline())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
