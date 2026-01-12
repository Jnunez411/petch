package project.petch.petch_api.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.pet.AdoptionDetailsDTO;
import project.petch.petch_api.service.AdoptionDetailsService;

@RestController
@RequestMapping("/api/pets/{petId}/adoption-details")
@RequiredArgsConstructor
@Slf4j
public class AdoptionDetailsController {
    private final AdoptionDetailsService adoptionDetailsService;

    @GetMapping
    public ResponseEntity<AdoptionDetailsDTO> getAdoptionDetails(@PathVariable Long petId) {
        log.debug("Fetching adoption details for petId={}", petId);
        return ResponseEntity.ok(adoptionDetailsService.getAdoptionDetails(petId));
    }

    @PostMapping
    public ResponseEntity<AdoptionDetailsDTO> createAdoptionDetails(@PathVariable Long petId,
            @RequestBody AdoptionDetailsDTO dto) {
        log.info("Creating adoption details for petId={}", petId);
        AdoptionDetailsDTO created = adoptionDetailsService.createAdoptionDetails(petId, dto);
        log.info("Adoption details created successfully for petId={}", petId);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping
    public ResponseEntity<AdoptionDetailsDTO> updateAdoptionDetails(@PathVariable Long petId,
            @RequestBody AdoptionDetailsDTO dto) {
        log.info("Updating adoption details for petId={}", petId);
        AdoptionDetailsDTO updated = adoptionDetailsService.updateAdoptionDetails(petId, dto);
        log.info("Adoption details updated successfully for petId={}", petId);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAdoptionDetails(@PathVariable Long petId) {
        log.warn("Deleting adoption details for petId={}", petId);
        adoptionDetailsService.deleteAdoptionDetails(petId);
        log.info("Adoption details deleted for petId={}", petId);
        return ResponseEntity.noContent().build();
    }
}
