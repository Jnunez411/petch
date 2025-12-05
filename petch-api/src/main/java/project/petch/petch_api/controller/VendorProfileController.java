package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.user.VendorProfileDTO;
import project.petch.petch_api.models.User;
import project.petch.petch_api.service.VendorProfileService;

import java.net.URI;
import java.util.Optional;

@RestController
@RequestMapping("/api/users/me/vendor-profile")
@RequiredArgsConstructor
public class VendorProfileController {

    private final VendorProfileService vendorProfileService;

    @GetMapping
    public ResponseEntity<VendorProfileDTO> getMyVendorProfile(Authentication authentication) {
        User user = (User) authentication.getPrincipal();
        Optional<VendorProfileDTO> profile = vendorProfileService.getByUserId(user.getId());
        
        return profile
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<VendorProfileDTO> createOrUpsert(
            Authentication authentication,
            @Valid @RequestBody VendorProfileDTO dto) {
        User user = (User) authentication.getPrincipal();
        VendorProfileDTO created = vendorProfileService.createOrUpdate(user.getId(), dto);
        
        String locationPath = "/api/users/me/vendor-profile";
        if (created.getId() != null) {
            locationPath += "/" + created.getId();
        }
        URI location = URI.create(locationPath);
        ResponseEntity<VendorProfileDTO> response = ResponseEntity.created(location).body(created);
        
        return response;
    }

    @PutMapping
    public ResponseEntity<VendorProfileDTO> update(
            Authentication authentication,
            @Valid @RequestBody VendorProfileDTO dto) {
        User user = (User) authentication.getPrincipal();
        
        // Check if profile exists
        Optional<VendorProfileDTO> existing = vendorProfileService.getByUserId(user.getId());
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        VendorProfileDTO updated = vendorProfileService.createOrUpdate(user.getId(), dto);
        return ResponseEntity.ok(updated);
    }
}
