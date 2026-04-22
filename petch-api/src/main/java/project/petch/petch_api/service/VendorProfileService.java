package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import project.petch.petch_api.dto.user.VendorProfileDTO;
import project.petch.petch_api.models.User;
import project.petch.petch_api.models.VerificationRequestStatus;
import project.petch.petch_api.models.VerificationStatus;
import project.petch.petch_api.models.VendorProfile;
import project.petch.petch_api.models.VendorVerificationRequest;
import project.petch.petch_api.repositories.UserRepository;
import project.petch.petch_api.repositories.VendorProfileRepository;
import project.petch.petch_api.repositories.VendorVerificationRequestRepository;

import java.util.Optional;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class VendorProfileService {

    private final VendorProfileRepository vendorProfileRepository;
    private final UserRepository userRepository;
    private final VendorVerificationRequestRepository vendorVerificationRequestRepository;

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
        profile.setVerificationStatus(VerificationStatus.UNVERIFIED);
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

    @Transactional
    public Optional<VendorProfileDTO> requestVerification(Long userId) {
        return requestVerification(userId, null);
    }

    @Transactional
    public Optional<VendorProfileDTO> requestVerification(Long userId, String supportingMetadata) {
        Long nonNullUserId = Objects.requireNonNull(userId, "userId must not be null");
        return vendorProfileRepository.findByUserId(nonNullUserId)
                .flatMap(existing -> {
                    VendorProfile profile = Objects.requireNonNull(existing);
                    VerificationStatus current = getVerificationStatus(profile);

                    boolean hasPendingRequest = vendorVerificationRequestRepository
                            .existsByVendorProfileIdAndStatus(profile.getId(), VerificationRequestStatus.PENDING);

                    if (current == VerificationStatus.PENDING || hasPendingRequest) {
                        throw new IllegalStateException("Verification request is already pending review");
                    }

                    if (current == VerificationStatus.VERIFIED) {
                        throw new IllegalStateException("Vendor is already verified");
                    }

                    profile.setVerificationStatus(VerificationStatus.PENDING);
                    VendorProfile savedProfile = vendorProfileRepository.save(profile);

                    VendorVerificationRequest verificationRequest = VendorVerificationRequest.builder()
                            .vendorProfile(savedProfile)
                            .status(VerificationRequestStatus.PENDING)
                            .supportingMetadata(supportingMetadata)
                            .build();

                    vendorVerificationRequestRepository.save(verificationRequest);

                    return Optional.ofNullable(toDTO(savedProfile));
                });
    }

    private void mapDtoToEntity(VendorProfileDTO dto, VendorProfile profile) {
        profile.setOrganizationName(dto.getOrganizationName());
        profile.setProfileImageUrl(dto.getProfileImageUrl());
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
                .profileImageUrl(profile.getProfileImageUrl())
                .websiteUrl(profile.getWebsiteUrl())
                .phoneNumber(profile.getPhoneNumber())
                .city(profile.getCity())
                .state(profile.getState())
                .description(profile.getDescription())
                .verificationStatus(getVerificationStatus(profile))
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    private VerificationStatus getVerificationStatus(VendorProfile profile) {
        return profile.getVerificationStatus() == null
                ? VerificationStatus.UNVERIFIED
                : profile.getVerificationStatus();
    }
}
