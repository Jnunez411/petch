package project.petch.petch_api.dto.user;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import project.petch.petch_api.models.VendorAdoptionPreferences.AdoptionContactMethod;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VendorAdoptionPreferencesDTO{
    private Long id;
    private boolean useShelterLocation;
    private Double longitude;
    private Double latitude;
    private AdoptionContactMethod contactMethod;
    private String directLinkUrl;
    private String contactNumber;
    private String stepsDescription;
    private String phoneNumber;
    private String email;
    private Boolean hasOnlineFormPdf;
    private String onlineFormFileName;
    private String onlineFormContentType;
    private Boolean payOnline;
    private java.time.LocalDateTime createdAt;
    private java.time.LocalDateTime updatedAt;
    
    public static VendorAdoptionPreferencesDTO fromEntity(project.petch.petch_api.models.VendorAdoptionPreferences entity){
        if(entity == null) return null;
        return VendorAdoptionPreferencesDTO.builder()
                .id(entity.getId())
                .useShelterLocation(entity.isUseShelterLocation())
                .longitude(entity.getLongitude())
                .latitude(entity.getLatitude())
                .contactMethod(entity.getContactMethod())
                .directLinkUrl(entity.getDirectLinkUrl())
                .contactNumber(entity.getContactNumber())
                .stepsDescription(entity.getStepsDescription())
                .phoneNumber(entity.getPhoneNumber())
                .email(entity.getEmail())
                .hasOnlineFormPdf(entity.getOnlineFormPdf() != null && entity.getOnlineFormPdf().length > 0)
                .onlineFormFileName(entity.getOnlineFormFileName())
                .onlineFormContentType(entity.getOnlineFormContentType())
                .payOnline(entity.getPayOnline())
                .createdAt(entity.getCreatedAt())
                .updatedAt(entity.getUpdatedAt())
                .build();
    }
}
