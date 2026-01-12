package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import project.petch.petch_api.dto.pet.ImageDTO;
import project.petch.petch_api.models.Images;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.repositories.ImagesRepository;
import project.petch.petch_api.repositories.PetsRepository;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ImageService {
    private final ImagesRepository imagesRepository;
    private final PetsRepository petsRepository;

    @Value("${app.upload.dir:uploads/images}")
    private String uploadDir;

    public List<ImageDTO> getImagesByPet(Long petId) {
        return imagesRepository.findByPetId(petId).stream().map(this::toDTO).collect(Collectors.toList());
    }

    public ImageDTO getImage(Long imageId) {
        Images image = imagesRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with id: " + imageId));
        return toDTO(image);
    }

    // Maximum file size: 10MB
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    // Allowed image content types
    private static final List<String> ALLOWED_CONTENT_TYPES = List.of(
            "image/jpeg", "image/png", "image/gif", "image/webp");

    public ImageDTO uploadImage(Long petId, MultipartFile file, String altText) throws IOException {
        Pets pet = petsRepository.findById(petId)
                .orElseThrow(() -> new RuntimeException("Pet not found with id: " + petId));
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        // SECURITY: Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IllegalArgumentException("File size exceeds maximum allowed (10MB)");
        }

        // SECURITY: Validate content type against whitelist
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new IllegalArgumentException("File must be an image (JPEG, PNG, GIF, or WebP)");
        }

        // SECURITY: Sanitize filename - only use the extension from original file
        String originalFilename = file.getOriginalFilename();
        String extension = "";
        if (originalFilename != null && originalFilename.contains(".")) {
            extension = originalFilename.substring(originalFilename.lastIndexOf(".")).toLowerCase();
            // Only allow safe extensions
            if (!extension.matches("\\.(jpg|jpeg|png|gif|webp)")) {
                throw new IllegalArgumentException("Invalid file extension");
            }
        } else {
            // Default to .jpg if no extension
            extension = ".jpg";
        }

        // SECURITY: Generate safe filename with only UUID and validated extension
        String filename = UUID.randomUUID().toString() + extension;
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();

        Files.createDirectories(uploadPath);

        // SECURITY: Ensure resolved path is still within upload directory (prevent path
        // traversal)
        Path filePath = uploadPath.resolve(filename).normalize();
        if (!filePath.startsWith(uploadPath)) {
            throw new SecurityException("Invalid file path detected");
        }

        file.transferTo(filePath.toFile());

        Images image = Images.builder()
                .fileName(filename)
                .filePath("/uploads/images/" + filename)
                .altText(altText != null ? altText : "Pet image")
                .fileSize(file.getSize())
                .pet(pet)
                .build();

        Images saved = imagesRepository.save(image);
        log.info("Image uploaded successfully: petId={}, imageId={}, filename={}", petId, saved.getId(), filename);
        return toDTO(saved);
    }

    public void deleteImage(Long imageId) throws IOException {
        Images image = imagesRepository.findById(imageId)
                .orElseThrow(() -> new RuntimeException("Image not found with id: " + imageId));

        Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(image.getFileName());
        Files.deleteIfExists(filePath);

        imagesRepository.deleteById(imageId);
    }

    public void deleteImagesByPet(Long petId) throws IOException {
        log.info("Deleting all images for petId={}", petId);
        List<Images> images = imagesRepository.findByPetId(petId);
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();

        for (Images image : images) {
            try {
                Path filePath = uploadPath.resolve(image.getFileName());
                Files.deleteIfExists(filePath);
                log.debug("Deleted image file: {}", image.getFileName());
            } catch (IOException e) {
                // Log but continue deleting other images and database records
                log.error("Failed to delete image file: {}, error: {}", image.getFileName(), e.getMessage());
            }
        }

        imagesRepository.deleteByPetId(petId);
        log.info("Deleted {} images for petId={}", images.size(), petId);
    }

    // PERFORMANCE: Use count query instead of loading all images
    public long getImageCountForPet(Long petId) {
        return imagesRepository.countByPetId(petId);
    }

    private ImageDTO toDTO(Images image) {
        return ImageDTO.builder()
                .id(image.getId())
                .filePath(image.getFilePath())
                .altText(image.getAltText())
                .fileSize(image.getFileSize())
                .createdAt(image.getCreatedAt())
                .build();
    }
}
