package project.petch.petch_api.models;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "vendor_adoption_preferences")
@Data
@EqualsAndHashCode(callSuper = false)
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VendorAdoptionPreferences{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vendor_profile_id", nullable = false, unique = true)
    private VendorProfile vendorProfile;

    @Column(name = "use_shelter_location", nullable = false)
    @Builder.Default
    private boolean useShelterLocation = false;

    @Column(name = "longitude")
    private Double longitude;

    @Column(name = "latitude")
    private Double latitude;

    public enum AdoptionContactMethod {
        DIRECT_LINK,
        CONTACT_NUMBER,
        ONLINE_FORM
    }

    @Enumerated(EnumType.STRING)
    @Column(name = "contact_method")
    private AdoptionContactMethod contactMethod;


    @Column(name = "direct_link_url")
    private String directLinkUrl; // if link

    @Column(name = "contact_number")
    private String contactNumber; // if contact

    @Column(name = "steps_description", length = 2000)
    private String stepsDescription;

    @Column(name = "phone_number", length = 20)
    private String phoneNumber;

    @Column(name = "email", length = 100)
    private String email;

    // Store PDF for online form as a BLOB
    @Lob
    @Column(name = "online_form_pdf")
    private byte[] onlineFormPdf; 

    @Column(name = "online_form_file_name")
    private String onlineFormFileName;

    @Column(name = "online_form_content_type")
    private String onlineFormContentType;

    @Column(name = "pay_online")
    @Builder.Default
    private Boolean payOnline = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private java.time.LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(nullable = false)
    private java.time.LocalDateTime updatedAt;
}
