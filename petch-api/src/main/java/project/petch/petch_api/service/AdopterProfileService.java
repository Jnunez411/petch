package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.petch.petch_api.dto.user.AdopterProfileDTO;
import project.petch.petch_api.models.AdopterProfile;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.AdopterProfileRepository;
import project.petch.petch_api.repositories.UserRepository;

import java.util.Optional;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class AdopterProfileService {

    private final AdopterProfileRepository adopterProfileRepository;
    private final UserRepository userRepository;

    // PERFORMANCE: Use readOnly transaction for read operations
    @Transactional(readOnly = true)
    public Optional<AdopterProfileDTO> getProfileByUserId(Long userId) {
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        return adopterProfileRepository.findByUserId(nonNullUserId).map(this::toDTO);
    }

    public AdopterProfileDTO createProfile(Long userId, AdopterProfileDTO dto) {
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        User user = userRepository.findById(nonNullUserId)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + userId));

        AdopterProfile profile = new AdopterProfile();
        profile.setUser(user);
        mapDtoToEntity(dto, profile);

        AdopterProfile saved = Objects.requireNonNull(adopterProfileRepository.save(profile));
        return toDTO(saved);
    }

    public Optional<AdopterProfileDTO> updateProfile(Long userId, AdopterProfileDTO dto) {
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        return adopterProfileRepository.findByUserId(nonNullUserId)
                .flatMap(existing -> {
                    AdopterProfile profile = Objects.requireNonNull(existing);
                    mapDtoToEntity(dto, profile);
                    return Optional.ofNullable(toDTO(adopterProfileRepository.save(profile)));
                });
    }

    private void mapDtoToEntity(AdopterProfileDTO dto, AdopterProfile profile) {
        profile.setHouseholdSize(dto.getHouseholdSize());
        profile.setHasChildren(dto.getHasChildren());
        profile.setHasOtherPets(dto.getHasOtherPets());
        profile.setHomeType(dto.getHomeType());
        profile.setYard(dto.getYard());
        profile.setFencedYard(dto.getFencedYard());
        profile.setAdditionalNotes(dto.getAdditionalNotes());
    }

    private AdopterProfileDTO toDTO(AdopterProfile profile) {
        if (profile == null)
            return null;
        return AdopterProfileDTO.builder()
                .id(profile.getId())
                .householdSize(profile.getHouseholdSize())
                .hasChildren(profile.getHasChildren())
                .hasOtherPets(profile.getHasOtherPets())
                .homeType(profile.getHomeType())
                .yard(profile.getYard())
                .fencedYard(profile.getFencedYard())
                .additionalNotes(profile.getAdditionalNotes())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
