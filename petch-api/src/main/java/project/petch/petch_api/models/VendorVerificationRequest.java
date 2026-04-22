package project.petch.petch_api.models;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_verification_requests")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorVerificationRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "vendor_profile_id", nullable = false)
    private VendorProfile vendorProfile;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VerificationRequestStatus status;

    @CreationTimestamp
    @Column(name = "submitted_at", nullable = false, updatable = false)
    private LocalDateTime submittedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewed_by")
    private User reviewedBy;

    @Column(name = "reviewed_at")
    private LocalDateTime reviewedAt;

    @Column(name = "rejection_reason", length = 1000)
    private String rejectionReason;

    @Column(name = "supporting_metadata", length = 4000)
    private String supportingMetadata;
}
