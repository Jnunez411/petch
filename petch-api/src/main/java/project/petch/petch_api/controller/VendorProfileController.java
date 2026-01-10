package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.user.VendorProfileDTO;
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.VendorProfileService;

import java.net.URI;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Objects;
import java.util.Optional;
import java.util.UUID;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/v1/vendor/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR')")
public class VendorProfileController {

    private final VendorProfileService vendorProfileService;

    @GetMapping("/me")
    public ResponseEntity<VendorProfileDTO> getMyVendorProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Optional<VendorProfileDTO> profile = vendorProfileService.getProfileByUserId(user.getId());

        return profile
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/me")
    public ResponseEntity<VendorProfileDTO> createVendorProfile(
            Authentication authentication,
            @Valid @RequestBody VendorProfileDTO dto) {
        User user = (User) authentication.getPrincipal();
        boolean exists = vendorProfileService.getProfileByUserId(user.getId()).isPresent();
        if (exists) {
            return ResponseEntity.status(409).build();
        }

        VendorProfileDTO created = vendorProfileService.createProfile(user.getId(), dto);
        String locationPath = "/api/v1/vendor/profile/me";
        URI location = URI.create(locationPath);
        return ResponseEntity.created(Objects.requireNonNull(location)).body(created);
    }

    @PutMapping("/me")
    public ResponseEntity<VendorProfileDTO> updateVendorProfile(
            Authentication authentication,
            @Valid @RequestBody VendorProfileDTO dto) {
        User user = (User) authentication.getPrincipal();
        return vendorProfileService.updateProfile(user.getId(), dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/me/image")
    public ResponseEntity<VendorProfileDTO> uploadProfileImage(
            Authentication authentication,
            @RequestParam("file") MultipartFile file) throws java.io.IOException {
        User user = (User) authentication.getPrincipal();
        Optional<VendorProfileDTO> profileOpt = vendorProfileService.getProfileByUserId(user.getId());

        if (profileOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        // Save file
        String filename = UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        // Use standard upload dir or fallback
        Path uploadPath = Paths.get("uploads/vendors").toAbsolutePath().normalize();
        Files.createDirectories(uploadPath);
        Path filePath = uploadPath.resolve(filename);
        file.transferTo(filePath.toFile());

        String fileUrl = "/uploads/vendors/" + filename;

        VendorProfileDTO dto = profileOpt.get();
        dto.setProfileImageUrl(fileUrl);

        return vendorProfileService.updateProfile(user.getId(), dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
