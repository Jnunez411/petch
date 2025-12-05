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

@Service
@RequiredArgsConstructor
public class VendorProfileService {

    private final VendorProfileRepository vendorProfileRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Optional<VendorProfileDTO> getByUserId(Long userId) {
        return vendorProfileRepository.findByUserId(userId)
                .map(this::toDTO);
    }

    @Transactional
    public VendorProfileDTO createOrUpdate(Long userId, VendorProfileDTO dto) {
        User user = userRepository.findById(userId).orElseThrow(() -> {
            return new RuntimeException("User not found with id: " + userId);
        });

        VendorProfile profile = vendorProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    VendorProfile newProfile = new VendorProfile();
                    newProfile.setUser(user);
                    return newProfile;
                });

        // Map DTO fields to entity
        profile.setOrganizationName(dto.getOrganizationName());
        profile.setWebsiteUrl(dto.getWebsiteUrl());
        profile.setPhoneNumber(dto.getPhoneNumber());
        profile.setCity(dto.getCity());
        profile.setState(dto.getState());
        profile.setDescription(dto.getDescription());

        VendorProfile saved = vendorProfileRepository.save(profile);
        return toDTO(saved);
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
