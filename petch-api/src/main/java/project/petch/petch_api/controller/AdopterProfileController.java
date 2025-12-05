package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.user.AdopterProfileDTO;
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.AdopterProfileService;

import java.net.URI;

@RestController
@RequestMapping("/api/users/me/adopter-profile")
@RequiredArgsConstructor
public class AdopterProfileController {

    private final AdopterProfileService adopterProfileService;

    /**
     * GET /api/users/me/adopter-profile
     * Returns the authenticated user's adopter profile if present.
     */
    @GetMapping
    public ResponseEntity<AdopterProfileDTO> getMyAdopterProfile() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        return adopterProfileService.getByUserId(currentUser.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    /**
     * POST /api/users/me/adopter-profile
     * Create or upsert the adopter profile for the authenticated user.
     */
    @PostMapping
    public ResponseEntity<AdopterProfileDTO> createOrUpsert(@Valid @RequestBody AdopterProfileDTO dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        AdopterProfileDTO created = adopterProfileService.createOrUpdate(currentUser.getId(), dto);
        String location = "/api/users/me/adopter-profile" + (created.getId() != null ? "/" + created.getId() : "");
        return ResponseEntity.created(URI.create(location)).body(created);
    }

    /**
     * PUT /api/users/me/adopter-profile
     * Update an existing adopter profile for the authenticated user.
     */
    @PutMapping
    public ResponseEntity<AdopterProfileDTO> update(@Valid @RequestBody AdopterProfileDTO dto) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        // Ensure profile exists
        if (adopterProfileService.getByUserId(currentUser.getId()).isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        AdopterProfileDTO updated = adopterProfileService.createOrUpdate(currentUser.getId(), dto);
        return ResponseEntity.ok(updated);
    }
}
