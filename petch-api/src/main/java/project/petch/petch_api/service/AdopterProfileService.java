package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import project.petch.petch_api.dto.user.AdopterProfileDTO;
import project.petch.petch_api.models.AdopterProfile;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.AdopterProfileRepository;
import project.petch.petch_api.repositories.UserRepository;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AdopterProfileService {

    private final AdopterProfileRepository adopterProfileRepository;
    private final UserRepository userRepository;

    public Optional<AdopterProfileDTO> getByUserId(Long userId) {
        return adopterProfileRepository.findByUserId(userId).map(this::toDTO);
    }

    public AdopterProfileDTO createOrUpdate(Long userId, AdopterProfileDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        AdopterProfile profile = adopterProfileRepository.findByUserId(userId).orElseGet(() -> {
            AdopterProfile p = new AdopterProfile();
            p.setUser(user);
            return p;
        });

        // Map fields from DTO to entity
        profile.setHouseholdSize(dto.getHouseholdSize());
        profile.setHasChildren(dto.getHasChildren());
        profile.setHasOtherPets(dto.getHasOtherPets());
        profile.setHomeType(dto.getHomeType());
        profile.setYard(dto.getYard());
        profile.setFencedYard(dto.getFencedYard());
        profile.setPreferredSpecies(dto.getPreferredSpecies());
        profile.setPreferredBreeds(dto.getPreferredBreeds());
        profile.setMinAge(dto.getMinAge());
        profile.setMaxAge(dto.getMaxAge());
        profile.setAdditionalNotes(dto.getAdditionalNotes());

        AdopterProfile saved = adopterProfileRepository.save(profile);
        return toDTO(saved);
    }

    private AdopterProfileDTO toDTO(AdopterProfile profile) {
        if (profile == null) return null;
        return AdopterProfileDTO.builder()
                .id(profile.getId())
                .householdSize(profile.getHouseholdSize())
                .hasChildren(profile.getHasChildren())
                .hasOtherPets(profile.getHasOtherPets())
                .homeType(profile.getHomeType())
                .yard(profile.getYard())
                .fencedYard(profile.getFencedYard())
                .preferredSpecies(profile.getPreferredSpecies())
                .preferredBreeds(profile.getPreferredBreeds())
                .minAge(profile.getMinAge())
                .maxAge(profile.getMaxAge())
                .additionalNotes(profile.getAdditionalNotes())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
