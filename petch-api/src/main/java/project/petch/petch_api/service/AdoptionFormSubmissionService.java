package project.petch.petch_api.service;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import project.petch.petch_api.dto.pet.AdoptionFormSubmissionDTO;
import project.petch.petch_api.exception.ResourceNotFoundException;
import project.petch.petch_api.models.AdoptionFormSubmission;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.models.VendorAdoptionPreferences;
import project.petch.petch_api.repositories.AdoptionDetailsRepository;
import project.petch.petch_api.repositories.AdoptionFormSubmissionRepository;
import project.petch.petch_api.repositories.PetsRepository;

@Service
@RequiredArgsConstructor
@Transactional
public class AdoptionFormSubmissionService{
    private final AdoptionFormSubmissionRepository submissionRepository;
    private final PetsRepository petsRepository;
    private final AdoptionDetailsRepository adoptionDetailsRepository;
    private final VendorAdoptionPreferencesService vendorAdoptionPreferencesService;

    @SuppressWarnings("null")
    public AdoptionFormSubmissionDTO submitForm(Long petId, MultipartFile file, User adopter) throws IOException{
        Long nonNullPetId = Objects.requireNonNull(petId, "petId must not be null");

        if(adopter == null){
            throw new IllegalArgumentException("User must be authenticated");
        }

        Pets pet = petsRepository.findById(nonNullPetId).orElseThrow(() -> new ResourceNotFoundException("Pet not found with id: " + nonNullPetId));

        VendorAdoptionPreferences template = vendorAdoptionPreferencesService.getOnlineFormTemplateForPet(nonNullPetId);
        if(template.getContactMethod() != VendorAdoptionPreferences.AdoptionContactMethod.ONLINE_FORM){
            throw new IllegalArgumentException("This pet does not accept online form submissions");
        }

        validatePdfFile(file);

        AdoptionFormSubmission submission = AdoptionFormSubmission.builder()
                .pet(pet)
                .adopterUser(adopter)
                .pdfData(file.getBytes())
                .fileName(file.getOriginalFilename())
                .contentType(file.getContentType() == null ? "application/pdf" : file.getContentType())
                .build();

        AdoptionFormSubmission savedSubmission = Objects.requireNonNull(submissionRepository.save(submission),"Failed to save adoption form submission");
        return toDTO(savedSubmission);
    }

    @Transactional(readOnly = true)
    public List<AdoptionFormSubmissionDTO> getSubmissionsForVendorPet(Long petId, User vendor){
        Pets pet = requireVendorOwnedPet(petId, vendor);
        return submissionRepository.findByPetIdOrderByCreatedAtDesc(pet.getId()).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AdoptionFormSubmissionDTO> getSubmissionsForVendor(User vendor){
        if(vendor == null){
            throw new IllegalArgumentException("User must be authenticated");
        }
        return submissionRepository.findByPetUserIdOrderByCreatedAtDesc(vendor.getId()).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AdoptionFormSubmissionDTO> getAccessibleSubmissionsForPet(Long petId, User user){
        Long nonNullPetId = Objects.requireNonNull(petId, "petId must not be null");
        if(user == null){
            throw new IllegalArgumentException("User must be authenticated");
        }

        Pets pet = petsRepository.findById(nonNullPetId).orElseThrow(() -> new ResourceNotFoundException("Pet not found with id: " + nonNullPetId));

        if(canViewAllSubmissionsForPet(pet, user)){
            return submissionRepository.findByPetIdOrderByCreatedAtDesc(nonNullPetId).stream().map(this::toDTO).toList();
        }

        return submissionRepository.findByPetIdAndAdopterUserIdOrderByCreatedAtDesc(nonNullPetId, user.getId()).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public List<AdoptionFormSubmissionDTO> getSubmissionsForAdopterPet(Long petId, User adopter){
        Long nonNullPetId = Objects.requireNonNull(petId, "petId must not be null");

        if(adopter == null){
            throw new IllegalArgumentException("User must be authenticated");
        }

        return submissionRepository.findByPetIdAndAdopterUserIdOrderByCreatedAtDesc(nonNullPetId, adopter.getId()).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public AdoptionFormSubmission getSubmissionForVendorPet(Long petId, Long submissionId, User vendor){
        requireVendorOwnedPet(petId, vendor);

        return submissionRepository.findByIdAndPetId(submissionId, petId).orElseThrow(() -> new ResourceNotFoundException("Submission not found for pet"));
    }

    public void deleteSubmissionForVendor(Long submissionId, User vendor){
        if(vendor == null){
            throw new IllegalArgumentException("User must be authenticated");
        }

        Long nonNullSubmissionId = Objects.requireNonNull(submissionId, "submissionId must not be null");
        AdoptionFormSubmission submission = submissionRepository.findById(nonNullSubmissionId).orElseThrow(() -> new ResourceNotFoundException("Submission not found"));

        if(!canViewAllSubmissionsForPet(submission.getPet(), vendor)){
            throw new IllegalArgumentException("You do not have access to delete this submission");
        }

        submissionRepository.delete(submission);
    }

    @Transactional(readOnly = true)
    public AdoptionFormSubmission getAccessibleSubmissionForPet(Long petId, Long submissionId, User user) {
        Long nonNullPetId = Objects.requireNonNull(petId, "petId must not be null");
        Long nonNullSubmissionId = Objects.requireNonNull(submissionId, "submissionId must not be null");

        if(user == null){
            throw new IllegalArgumentException("User must be authenticated");
        }

        Pets pet = petsRepository.findById(nonNullPetId).orElseThrow(() -> new ResourceNotFoundException("Pet not found with id: " + nonNullPetId));

        if(canViewAllSubmissionsForPet(pet, user)){
            return submissionRepository.findByIdAndPetId(nonNullSubmissionId, nonNullPetId).orElseThrow(() -> new ResourceNotFoundException("Submission not found for pet"));
        }

        return submissionRepository.findByIdAndPetIdAndAdopterUserId(nonNullSubmissionId, nonNullPetId, user.getId()).orElseThrow(() -> new ResourceNotFoundException("Submission not found for user and pet"));
    }

    @Transactional(readOnly = true)
    public AdoptionFormSubmission getSubmissionForAdopterPet(Long petId, Long submissionId, User adopter){
        Long nonNullPetId = Objects.requireNonNull(petId, "petId must not be null");
        Long nonNullSubmissionId = Objects.requireNonNull(submissionId, "submissionId must not be null");

        if(adopter == null){
            throw new IllegalArgumentException("User must be authenticated");
        }

        return submissionRepository.findByIdAndPetIdAndAdopterUserId(nonNullSubmissionId, nonNullPetId, adopter.getId()).orElseThrow(() -> new ResourceNotFoundException("Submission not found for adopter and pet"));
    }

    @Transactional(readOnly = true)
    public List<AdoptionFormSubmissionDTO> getSubmissionsForAdopter(User adopter){
        if(adopter == null){
            throw new IllegalArgumentException("User must be authenticated");
        }
        return submissionRepository.findByAdopterUserIdOrderByCreatedAtDesc(adopter.getId()).stream().map(this::toDTO).toList();
    }

    @Transactional(readOnly = true)
    public AdoptionFormSubmission getSubmissionForAdopter(Long submissionId, User adopter){
        if(adopter == null){
            throw new IllegalArgumentException("User must be authenticated");
        }

        Long nonNullSubmissionId = Objects.requireNonNull(submissionId, "submissionId must not be null");
        return submissionRepository.findByIdAndAdopterUserId(nonNullSubmissionId, adopter.getId()).orElseThrow(() -> new ResourceNotFoundException("Submission not found for adopter"));
    }

    private Pets requireVendorOwnedPet(Long petId, User vendor){
        Long nonNullPetId = Objects.requireNonNull(petId, "petId must not be null");

        if(vendor == null){
            throw new IllegalArgumentException("User must be authenticated");
        }

        Pets pet = petsRepository.findById(nonNullPetId).orElseThrow(() -> new ResourceNotFoundException("Pet not found with id: " + nonNullPetId));

        boolean isAdmin = vendor.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean ownsPet = pet.getUser() != null && pet.getUser().getId().equals(vendor.getId());

        if(!isAdmin && !ownsPet){
            throw new IllegalArgumentException("You do not have access to submissions for this pet");
        }

        return pet;
    }

    private boolean canViewAllSubmissionsForPet(Pets pet, User user){
        boolean isAdmin = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean ownsPet = pet.getUser() != null && pet.getUser().getId().equals(user.getId());

        return isAdmin || ownsPet;
    }

    private void validatePdfFile(MultipartFile file){
        if(file == null || file.isEmpty()){
            throw new IllegalArgumentException("PDF file cannot be empty");
        }

        if(file.getSize() > 10 * 1024 * 1024){
            throw new IllegalArgumentException("PDF file size exceeds maximum allowed (10MB)");
        }

        String contentType = file.getContentType();
        String originalFilenameValue = file.getOriginalFilename();
        String originalFilename = originalFilenameValue == null ? "" : originalFilenameValue.toLowerCase();

        if(!"application/pdf".equalsIgnoreCase(contentType) && !originalFilename.endsWith(".pdf")){
            throw new IllegalArgumentException("File must be a PDF");
        }
    }

    private AdoptionFormSubmissionDTO toDTO(AdoptionFormSubmission submission) {
        String adopterName = ((submission.getAdopterUser().getFirstName() == null ? "" : submission.getAdopterUser().getFirstName()) + " " + (submission.getAdopterUser().getLastName() == null ? "" : submission.getAdopterUser().getLastName())).trim();

        return AdoptionFormSubmissionDTO.builder()
                .id(submission.getId())
                .petId(submission.getPet().getId())
                .petName(submission.getPet().getName())
                .adopterUserId(submission.getAdopterUser().getId())
                .adopterName(adopterName)
                .adopterEmail(submission.getAdopterUser().getEmail())
                .fileName(submission.getFileName())
                .contentType(submission.getContentType())
                .priceEstimate(adoptionDetailsRepository.findByPetId(submission.getPet().getId()).map(d -> d.getPriceEstimate()).orElse(null))
                .createdAt(submission.getCreatedAt())
                .build();
    }
}