package project.petch.petch_api.models;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "vendor_profiles")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonBackReference("vendor-user")
    private User user;

    @Column(nullable = false)
    private String organizationName;

    private String profileImageUrl;

    private String websiteUrl;

    private String phoneNumber;

    private String city;

    private String state;

    @Column(length = 1000)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status")
    private VerificationStatus verificationStatus;

    @com.fasterxml.jackson.annotation.JsonIgnore
    @OneToOne(mappedBy = "vendorProfile", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private VendorAdoptionPreferences adoptionPreferences;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private LocalDateTime updatedAt;
}
