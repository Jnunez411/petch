package project.petch.petch_api.dto.admin;

import lombok.Builder;
import lombok.Data;
import project.petch.petch_api.dto.user.UserType;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserDto {
    private Long id;
    private String email;
    private String firstName;
    private String lastName;
    private UserType userType;
    private String phoneNumber;
    private Boolean emailNotificationsEnabled;
    private Boolean deletionRequested;
    private LocalDateTime deletionRequestedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
