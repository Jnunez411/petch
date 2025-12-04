package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
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
public class ImageService{
    private final ImagesRepository imagesRepository;
    private final PetsRepository petsRepository;

    @Value("${app.upload.dir:uploads/images}")
    private String uploadDir;

    public List<ImageDTO> getImagesByPet(Long petId){
        return imagesRepository.findByPetId(petId).stream().map(this::toDTO).collect(Collectors.toList());
    }


    public ImageDTO getImage(Long imageId){
        Images image = imagesRepository.findById(imageId).orElseThrow(() -> new RuntimeException("Image not found with id: " + imageId));
        return toDTO(image);
    }

    public ImageDTO uploadImage(Long petId, MultipartFile file, String altText) throws IOException {
        Pets pet = petsRepository.findById(petId).orElseThrow(() -> new RuntimeException("Pet not found with id: " + petId));
        if(file.isEmpty()){
            throw new IllegalArgumentException("File cannot be empty");
        }

        String contentType = file.getContentType();
        if(contentType == null || !contentType.startsWith("image/")){
            throw new IllegalArgumentException("File must be an image");
        }

        String originalFilename = file.getOriginalFilename();
        String filename = UUID.randomUUID().toString() + "_" + originalFilename;
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();

        Files.createDirectories(uploadPath);

        Path filePath = uploadPath.resolve(filename);
        file.transferTo(filePath.toFile());

        Images image = Images.builder()
                .fileName(filename)
                .filePath("/uploads/images/" + filename)
                .altText(altText != null ? altText : "Pet image")
                .fileSize(file.getSize())
                .pet(pet)
                .build();

        Images saved = imagesRepository.save(image);
        return toDTO(saved);
    }


    public void deleteImage(Long imageId)throws IOException{
        Images image = imagesRepository.findById(imageId).orElseThrow(() -> new RuntimeException("Image not found with id: " + imageId));

        Path filePath = Paths.get(uploadDir).toAbsolutePath().resolve(image.getFileName());
        Files.deleteIfExists(filePath);

        imagesRepository.deleteById(imageId);
    }

    public void deleteImagesByPet(Long petId) throws IOException {
        List<Images> images = imagesRepository.findByPetId(petId);
        Path uploadPath = Paths.get(uploadDir).toAbsolutePath();

        for(Images image : images){
            try {
                Path filePath = uploadPath.resolve(image.getFileName());
                Files.deleteIfExists(filePath);
            } catch (IOException e) {
                // Log but continue deleting other images and database records
                System.err.println("Failed to delete image file: " + image.getFileName() + ", " + e.getMessage());
            }
        }

        imagesRepository.deleteByPetId(petId);
    }

    public long getImageCountForPet(Long petId) {
        return imagesRepository.findByPetId(petId).size();
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
