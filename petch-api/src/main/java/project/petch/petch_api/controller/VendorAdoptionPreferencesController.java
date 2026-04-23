package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import project.petch.petch_api.dto.user.VendorAdoptionPreferencesDTO;
import project.petch.petch_api.models.User;
import project.petch.petch_api.models.VendorAdoptionPreferences;
import project.petch.petch_api.service.VendorAdoptionPreferencesService;

import java.io.IOException;
import java.util.Objects;

@RestController
@RequestMapping("/api/v1/vendor/adoption-preferences")
@RequiredArgsConstructor
@PreAuthorize("hasRole('VENDOR')")
public class VendorAdoptionPreferencesController{
    private final VendorAdoptionPreferencesService service;

    @GetMapping("/me")
    public ResponseEntity<VendorAdoptionPreferencesDTO> getMyPreferences(Authentication authentication){
        User user = (User) authentication.getPrincipal();
        return service.getByUserId(user.getId())
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping("/me")
    public ResponseEntity<VendorAdoptionPreferencesDTO> createMyPreferences(Authentication authentication,@Valid @RequestBody VendorAdoptionPreferencesDTO dto){
        User user = (User) authentication.getPrincipal();

        try{
            VendorAdoptionPreferencesDTO saved = service.createForUserId(user.getId(), dto);
            return ResponseEntity.ok(saved);
        }catch(IllegalStateException exception){
            return ResponseEntity.status(409).build();
        }
    }

    @PutMapping("/me")
    public ResponseEntity<VendorAdoptionPreferencesDTO> updateMyPreferences(Authentication authentication,@Valid @RequestBody VendorAdoptionPreferencesDTO dto){
        User user = (User) authentication.getPrincipal();
        return service.updateForUserId(user.getId(), dto)
                .map(ResponseEntity::ok)
                .orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping(value = "/me/online-form-pdf", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<VendorAdoptionPreferencesDTO> uploadMyOnlineFormPdf(Authentication authentication,@RequestParam("file") MultipartFile file) throws IOException{
        User user = (User) authentication.getPrincipal();

        try{
            VendorAdoptionPreferencesDTO saved = service.uploadOnlineFormPdfForUserId(user.getId(), file);
            return ResponseEntity.ok(saved);
        }catch (IllegalArgumentException exception){
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/me/online-form-pdf")
    public ResponseEntity<Void> deleteMyOnlineFormPdf(Authentication authentication){
        User user = (User) authentication.getPrincipal();
        boolean deleted = service.deleteOnlineFormPdfForUserId(user.getId());
        return deleted ? ResponseEntity.noContent().build() : ResponseEntity.notFound().build();
    }

    @GetMapping("/pets/{petId}/online-form-template")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<byte[]> downloadOnlineFormTemplate(@PathVariable Long petId) {
        VendorAdoptionPreferences preferences = service.getOnlineFormTemplateForPet(petId);

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,"attachment; filename=\"" + preferences.getOnlineFormFileName() + "\"")
                .contentType(Objects.requireNonNull(MediaType.APPLICATION_PDF))
                .body(preferences.getOnlineFormPdf());
    }

    @GetMapping("/pets/{petId}/online-form-template/info")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<VendorAdoptionPreferencesDTO> getOnlineFormTemplateInfo(@PathVariable Long petId) {
        VendorAdoptionPreferences preferences = service.getOnlineFormTemplateForPet(petId);
        return ResponseEntity.ok(VendorAdoptionPreferencesDTO.fromEntity(preferences));
    }
}

