package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.user.AdopterProfileDTO;
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.AdopterProfileService;

import java.net.URI;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/adopter/profile")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADOPTER')")
@Slf4j
public class AdopterProfileController {

    private final AdopterProfileService adopterProfileService;

    /**
     * GET /api/users/me/adopter-profile
     * Returns the authenticated user's adopter profile if present.
     */
    @GetMapping("/me")
    public ResponseEntity<AdopterProfileDTO> getMyAdopterProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        log.debug("Fetching adopter profile for userId={}", currentUser.getId());

        return adopterProfileService.getProfileByUserId(currentUser.getId())
                .map(profile -> {
                    log.debug("Adopter profile found for userId={}", currentUser.getId());
                    return ResponseEntity.ok(profile);
                })
                .orElseGet(() -> {
                    log.debug("Adopter profile not found for userId={}", currentUser.getId());
                    return ResponseEntity.notFound().build();
                });
    }

    /**
     * POST /api/users/me/adopter-profile
     * Create or upsert the adopter profile for the authenticated user.
     */
    @PostMapping("/me")
    public ResponseEntity<AdopterProfileDTO> createAdopterProfile(@Valid @RequestBody AdopterProfileDTO dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        log.info("Creating adopter profile for userId={}", currentUser.getId());

        boolean exists = adopterProfileService.getProfileByUserId(currentUser.getId()).isPresent();
        if (exists) {
            log.warn("Adopter profile already exists for userId={}", currentUser.getId());
            return ResponseEntity.status(409).build();
        }

        AdopterProfileDTO created = adopterProfileService.createProfile(currentUser.getId(), dto);
        log.info("Adopter profile created successfully for userId={}", currentUser.getId());
        String location = "/api/v1/adopter/profile/me";
        URI uri = URI.create(location);
        return ResponseEntity.created(Objects.requireNonNull(uri)).body(created);
    }

    /**
     * PUT /api/users/me/adopter-profile
     * Update an existing adopter profile for the authenticated user.
     */
    @PutMapping("/me")
    public ResponseEntity<AdopterProfileDTO> updateAdopterProfile(@Valid @RequestBody AdopterProfileDTO dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();
        log.info("Updating adopter profile for userId={}", currentUser.getId());

        return adopterProfileService.updateProfile(currentUser.getId(), dto)
                .map(profile -> {
                    log.info("Adopter profile updated successfully for userId={}", currentUser.getId());
                    return ResponseEntity.ok(profile);
                })
                .orElseGet(() -> {
                    log.warn("Adopter profile not found for update: userId={}", currentUser.getId());
                    return ResponseEntity.notFound().build();
                });
    }
}
