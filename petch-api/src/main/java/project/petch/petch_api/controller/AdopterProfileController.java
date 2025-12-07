package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

        return adopterProfileService.getProfileByUserId(currentUser.getId())
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/users/me/adopter-profile
     * Create or upsert the adopter profile for the authenticated user.
     */
    @PostMapping("/me")
    public ResponseEntity<AdopterProfileDTO> createAdopterProfile(@Valid @RequestBody AdopterProfileDTO dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        boolean exists = adopterProfileService.getProfileByUserId(currentUser.getId()).isPresent();
        if (exists) {
            return ResponseEntity.status(409).build();
        }

        AdopterProfileDTO created = adopterProfileService.createProfile(currentUser.getId(), dto);
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

        return adopterProfileService.updateProfile(currentUser.getId(), dto)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
}
