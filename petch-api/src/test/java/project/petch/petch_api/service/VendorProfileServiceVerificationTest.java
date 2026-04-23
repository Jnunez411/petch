package project.petch.petch_api.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import project.petch.petch_api.models.User;
import project.petch.petch_api.models.VerificationRequestStatus;
import project.petch.petch_api.models.VerificationStatus;
import project.petch.petch_api.models.VendorProfile;
import project.petch.petch_api.models.VendorVerificationRequest;
import project.petch.petch_api.repositories.UserRepository;
import project.petch.petch_api.repositories.VendorProfileRepository;
import project.petch.petch_api.repositories.VendorVerificationRequestRepository;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class VendorProfileServiceVerificationTest {

    @Mock
    private VendorProfileRepository vendorProfileRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private VendorVerificationRequestRepository vendorVerificationRequestRepository;

    @InjectMocks
    private VendorProfileService vendorProfileService;

    @Test
    void requestVerification_setsPending_whenCurrentStatusIsUnverified() {
        User user = new User();
        user.setId(10L);

        VendorProfile profile = new VendorProfile();
        profile.setId(22L);
        profile.setUser(user);
        profile.setOrganizationName("Happy Paws");
        profile.setVerificationStatus(VerificationStatus.UNVERIFIED);

        when(vendorProfileRepository.findByUserId(10L)).thenReturn(Optional.of(profile));
        when(vendorProfileRepository.save(any(VendorProfile.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(vendorVerificationRequestRepository.existsByVendorProfileIdAndStatus(22L, VerificationRequestStatus.PENDING))
            .thenReturn(false);
        when(vendorVerificationRequestRepository.save(any(VendorVerificationRequest.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        var result = vendorProfileService.requestVerification(10L);

        assertTrue(result.isPresent());
        assertEquals(VerificationStatus.PENDING, result.get().getVerificationStatus());

        ArgumentCaptor<VendorProfile> captor = ArgumentCaptor.forClass(VendorProfile.class);
        verify(vendorProfileRepository).save(captor.capture());
        assertEquals(VerificationStatus.PENDING, captor.getValue().getVerificationStatus());

        ArgumentCaptor<VendorVerificationRequest> requestCaptor = ArgumentCaptor.forClass(VendorVerificationRequest.class);
        verify(vendorVerificationRequestRepository).save(requestCaptor.capture());
        assertEquals(VerificationRequestStatus.PENDING, requestCaptor.getValue().getStatus());
        assertEquals(22L, requestCaptor.getValue().getVendorProfile().getId());
    }

    @Test
    void requestVerification_throws_whenAlreadyPending() {
        User user = new User();
        user.setId(11L);

        VendorProfile profile = new VendorProfile();
        profile.setId(23L);
        profile.setUser(user);
        profile.setOrganizationName("Safe Shelter");
        profile.setVerificationStatus(VerificationStatus.PENDING);

        when(vendorProfileRepository.findByUserId(11L)).thenReturn(Optional.of(profile));
        when(vendorVerificationRequestRepository.existsByVendorProfileIdAndStatus(23L, VerificationRequestStatus.PENDING))
            .thenReturn(true);

        IllegalStateException exception = assertThrows(IllegalStateException.class,
                () -> vendorProfileService.requestVerification(11L));

        assertEquals("Verification request is already pending review", exception.getMessage());
    }
}
