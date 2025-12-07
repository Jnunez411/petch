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
import java.util.Objects;
import java.util.Optional;

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
}
