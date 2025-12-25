package project.petch.petch_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import project.petch.petch_api.dto.pet.AdoptionDetailsDTO;
import project.petch.petch_api.service.AdoptionDetailsService;

@RestController
@RequestMapping("/api/pets/{petId}/adoption-details")
@RequiredArgsConstructor
public class AdoptionDetailsController {
    private final AdoptionDetailsService adoptionDetailsService;

    @GetMapping
    public ResponseEntity<AdoptionDetailsDTO> getAdoptionDetails(@PathVariable Long petId) {
        return ResponseEntity.ok(adoptionDetailsService.getAdoptionDetails(petId));
    }

    @PostMapping
    public ResponseEntity<AdoptionDetailsDTO> createAdoptionDetails(@PathVariable Long petId,
            @RequestBody AdoptionDetailsDTO dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adoptionDetailsService.createAdoptionDetails(petId, dto));
    }

    @PutMapping
    public ResponseEntity<AdoptionDetailsDTO> updateAdoptionDetails(@PathVariable Long petId,
            @RequestBody AdoptionDetailsDTO dto) {
        return ResponseEntity.ok(adoptionDetailsService.updateAdoptionDetails(petId, dto));
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAdoptionDetails(@PathVariable Long petId) {
        adoptionDetailsService.deleteAdoptionDetails(petId);
        return ResponseEntity.noContent().build();
    }
}
