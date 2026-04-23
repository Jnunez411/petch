package project.petch.petch_api.service;

import java.io.IOException;
import java.util.List;
import java.util.Objects;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;
import project.petch.petch_api.dto.pet.PetDocumentFileDTO;
import project.petch.petch_api.dto.pet.PetDocumentsDTO;
import project.petch.petch_api.exception.ResourceNotFoundException;
import project.petch.petch_api.models.PetDocumentFile;
import project.petch.petch_api.models.PetDocuments;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.PetDocumentFileRepository;
import project.petch.petch_api.repositories.PetDocumentsRepository;
import project.petch.petch_api.repositories.PetsRepository;

@Service
@RequiredArgsConstructor
@Transactional
public class PetDocumentsService {
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of("application/pdf");

    private final PetDocumentsRepository petDocumentsRepository;
    private final PetDocumentFileRepository petDocumentFileRepository;
    private final PetsRepository petsRepository;

    @Transactional(readOnly = true)
    public PetDocumentsDTO getDocumentsForPet(Long petId){
        Long nonNullPetId = Objects.requireNonNull(petId, "petId must not be null");

        List<PetDocumentFileDTO> documents = petDocumentsRepository.findByPetId(nonNullPetId).map(PetDocuments::getDocuments).orElse(List.of()).stream().map(this::toDTO).toList();
        return PetDocumentsDTO.builder().petId(nonNullPetId).documents(documents).build();
    }

    public PetDocumentFileDTO uploadDocument(Long petId, MultipartFile file, User user) throws IOException{
        Pets pet = requireOwnedPet(petId, user);
        validateDocument(file);

        PetDocuments petDocuments = petDocumentsRepository.findByPetId(pet.getId()).orElseGet(() -> petDocumentsRepository.save(PetDocuments.builder().pet(pet).build()));

        String originalFilename = sanitizeFilename(file.getOriginalFilename());
        String contentType = file.getContentType() == null ? "application/octet-stream" : file.getContentType();

        PetDocumentFile document = PetDocumentFile.builder()
                .petDocuments(petDocuments)
                .fileName(originalFilename)
                .contentType(contentType)
                .fileSize(file.getSize())
                .documentData(file.getBytes())
                .build();

        PetDocumentFile savedDocument = petDocumentFileRepository.save(document);
        return toDTO(savedDocument);
    }

    @Transactional(readOnly = true)
    public PetDocumentFile getDocumentForPet(Long petId, Long documentId){
        Long nonNullPetId = Objects.requireNonNull(petId, "petId must not be null");
        Long nonNullDocumentId = Objects.requireNonNull(documentId, "documentId must not be null");

        return petDocumentFileRepository.findByIdAndPetDocumentsPetId(nonNullDocumentId, nonNullPetId).orElseThrow(() -> new ResourceNotFoundException("Document not found for pet"));
    }

    public void deleteDocumentsByPet(Long petId){
        petDocumentsRepository.findByPetId(petId).ifPresent(petDocuments -> {
            petDocuments.getDocuments().clear();
            petDocumentsRepository.flush();
            petDocumentsRepository.delete(petDocuments);
        });
    }

    private Pets requireOwnedPet(Long petId, User user){
        Long nonNullPetId = Objects.requireNonNull(petId, "petId must not be null");

        if(user == null){
            throw new IllegalArgumentException("User must be authenticated");
        }

        Pets pet = petsRepository.findById(nonNullPetId).orElseThrow(() -> new ResourceNotFoundException("Pet not found with id: " + nonNullPetId));

        boolean isAdmin = user.getAuthorities().stream().anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        boolean ownsPet = pet.getUser() != null && pet.getUser().getId().equals(user.getId());

        if(!isAdmin && !ownsPet){
            throw new IllegalArgumentException("You do not have access to manage documents for this pet");
        }

        return pet;
    }

    private void validateDocument(MultipartFile file){
        if(file == null || file.isEmpty()){
            throw new IllegalArgumentException("Document file cannot be empty");
        }

        if(file.getSize() > MAX_FILE_SIZE){
            throw new IllegalArgumentException("Document file size exceeds maximum allowed (10MB)");
        }

        String contentType = file.getContentType();
        String originalFilenameValue = file.getOriginalFilename();
        String originalFilename = originalFilenameValue == null ? "" : originalFilenameValue.toLowerCase();

        boolean hasAllowedContentType = contentType != null && ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase());
        boolean hasAllowedExtension = originalFilename.endsWith(".pdf");

        if(!hasAllowedContentType && !hasAllowedExtension){
            throw new IllegalArgumentException("File must be a PDF");
        }
    }

    private String sanitizeFilename(String originalFilename){
        if(originalFilename == null || originalFilename.isBlank()){
            return "pet-document";
        }

        return originalFilename
                .replace("\\", "_")
                .replace("/", "_")
                .replace("\r", "")
                .replace("\n", "")
                .trim();
    }

    private PetDocumentFileDTO toDTO(PetDocumentFile document){
        return PetDocumentFileDTO.builder()
                .id(document.getId())
                .fileName(document.getFileName())
                .contentType(document.getContentType())
                .fileSize(document.getFileSize())
                .createdAt(document.getCreatedAt())
                .build();
    }
}