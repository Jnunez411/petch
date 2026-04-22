package project.petch.petch_api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import project.petch.petch_api.models.User;
import project.petch.petch_api.models.VerificationStatus;
import project.petch.petch_api.models.VendorProfile;
import project.petch.petch_api.models.VendorVerificationRequest;
import project.petch.petch_api.repositories.AdminAuditLogRepository;
import project.petch.petch_api.repositories.PetInteractionRepository;
import project.petch.petch_api.repositories.PetsRepository;
import project.petch.petch_api.repositories.ReportRepository;
import project.petch.petch_api.repositories.UserRepository;
import project.petch.petch_api.repositories.VendorProfileRepository;
import project.petch.petch_api.repositories.VendorVerificationRequestRepository;

import java.util.List;
import java.util.Optional;

import project.petch.petch_api.models.VerificationRequestStatus;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminServiceVerificationRequestTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PetsRepository petsRepository;

    @Mock
    private AdminAuditLogRepository auditLogRepository;

    @Mock
    private ReportRepository reportRepository;

    @Mock
    private PetInteractionRepository petInteractionRepository;

    @Mock
    private ImageService imageService;

    @Mock
    private PetDocumentsService petDocumentsService;

    @Mock
    private VendorProfileRepository vendorProfileRepository;

    @Mock
    private VendorVerificationRequestRepository vendorVerificationRequestRepository;

    @InjectMocks
    private AdminService adminService;

    @BeforeEach
    void setUpSecurityContext() {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken("admin@petch.test", "n/a", List.of())
        );
    }

    @Test
    void getVerificationRequests_readsFromRequestRepository() {
        User vendorUser = new User();
        vendorUser.setId(77L);
        vendorUser.setEmail("vendor@petch.test");

        VendorProfile profile = VendorProfile.builder()
                .id(10L)
                .organizationName("Happy Paws")
                .user(vendorUser)
                .city("Austin")
                .state("TX")
                .build();

        VendorVerificationRequest request = VendorVerificationRequest.builder()
                .id(100L)
                .vendorProfile(profile)
                .status(VerificationRequestStatus.PENDING)
                .build();

        when(vendorVerificationRequestRepository.findByStatusOrderBySubmittedAtAsc(VerificationRequestStatus.PENDING))
                .thenReturn(List.of(request));

        var result = adminService.getVerificationRequests(VerificationRequestStatus.PENDING);

        assertEquals(1, result.size());
        assertEquals(100L, result.getFirst().verificationRequestId());
        assertEquals(10L, result.getFirst().vendorProfileId());
        assertEquals(VerificationRequestStatus.PENDING, result.getFirst().requestStatus());
    }

    @Test
    void reviewVerificationRequest_updatesRequestAndVendorStatus() {
        User reviewer = new User();
        reviewer.setId(1L);
        reviewer.setEmail("admin@petch.test");

        User vendorUser = new User();
        vendorUser.setId(2L);
        vendorUser.setEmail("vendor@petch.test");

        VendorProfile profile = VendorProfile.builder()
                .id(22L)
                .organizationName("Safe Shelter")
                .user(vendorUser)
                .verificationStatus(VerificationStatus.PENDING)
                .build();

        VendorVerificationRequest request = VendorVerificationRequest.builder()
                .id(300L)
                .vendorProfile(profile)
                .status(VerificationRequestStatus.PENDING)
                .build();

        when(userRepository.findByEmail("admin@petch.test")).thenReturn(Optional.of(reviewer));
        when(vendorVerificationRequestRepository.findById(300L)).thenReturn(Optional.of(request));
        when(vendorVerificationRequestRepository.save(any(VendorVerificationRequest.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(vendorProfileRepository.save(any(VendorProfile.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        var dto = adminService.reviewVerificationRequest(300L, VerificationRequestStatus.REJECTED, "missing docs");

        assertEquals(VerificationRequestStatus.REJECTED, dto.requestStatus());
        assertEquals("missing docs", dto.rejectionReason());
        assertEquals("admin@petch.test", dto.reviewedBy());
        assertEquals(VerificationStatus.REJECTED, profile.getVerificationStatus());

        verify(vendorVerificationRequestRepository).save(any(VendorVerificationRequest.class));
        verify(vendorProfileRepository).save(any(VendorProfile.class));
        verify(auditLogRepository).save(any());
    }

    @Test
    void reviewVerificationRequest_throwsForNonPendingRequest() {
        User reviewer = new User();
        reviewer.setEmail("admin@petch.test");

        VendorProfile profile = VendorProfile.builder().id(44L).build();
        VendorVerificationRequest request = VendorVerificationRequest.builder()
                .id(401L)
                .vendorProfile(profile)
                .status(VerificationRequestStatus.APPROVED)
                .build();

        when(userRepository.findByEmail("admin@petch.test")).thenReturn(Optional.of(reviewer));
        when(vendorVerificationRequestRepository.findById(401L)).thenReturn(Optional.of(request));

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> adminService.reviewVerificationRequest(401L, VerificationRequestStatus.REJECTED, "late review")
        );

        assertTrue(ex.getMessage().contains("Only pending verification requests"));
    }
}
