package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.petch.petch_api.dto.user.VendorProfileDTO;
import project.petch.petch_api.models.User;
import project.petch.petch_api.models.VendorProfile;
import project.petch.petch_api.repositories.UserRepository;
import project.petch.petch_api.repositories.VendorProfileRepository;

import java.util.Optional;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class VendorProfileService {

    private final VendorProfileRepository vendorProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Optional<VendorProfileDTO> getProfileByUserId(Long userId) {
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        return vendorProfileRepository.findByUserId(nonNullUserId)
                .map(this::toDTO);
    }

    @Transactional
    public VendorProfileDTO createProfile(Long userId, VendorProfileDTO dto) {
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        User user = userRepository.findById(nonNullUserId).orElseThrow(() -> {
            return new RuntimeException("User not found with id: " + userId);
        });

        VendorProfile profile = new VendorProfile();
        profile.setUser(user);
        mapDtoToEntity(dto, profile);

        VendorProfile saved = Objects.requireNonNull(vendorProfileRepository.save(profile));
        return toDTO(saved);
    }

    @Transactional
    public Optional<VendorProfileDTO> updateProfile(Long userId, VendorProfileDTO dto) {
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        return vendorProfileRepository.findByUserId(nonNullUserId)
                .flatMap(existing -> {
                    VendorProfile profile = Objects.requireNonNull(existing);
                    mapDtoToEntity(dto, profile);
                    return Optional.ofNullable(toDTO(vendorProfileRepository.save(profile)));
                });
    }

    private void mapDtoToEntity(VendorProfileDTO dto, VendorProfile profile) {
        profile.setOrganizationName(dto.getOrganizationName());
        profile.setWebsiteUrl(dto.getWebsiteUrl());
        profile.setPhoneNumber(dto.getPhoneNumber());
        profile.setCity(dto.getCity());
        profile.setState(dto.getState());
        profile.setDescription(dto.getDescription());
    }

    private VendorProfileDTO toDTO(VendorProfile profile) {
        return VendorProfileDTO.builder()
                .id(profile.getId())
                .organizationName(profile.getOrganizationName())
                .websiteUrl(profile.getWebsiteUrl())
                .phoneNumber(profile.getPhoneNumber())
                .city(profile.getCity())
                .state(profile.getState())
                .description(profile.getDescription())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }
}
