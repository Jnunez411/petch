package project.petch.petch_api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import project.petch.petch_api.dto.user.UserType;

public record RegisterRequest(
                @NotBlank(message = "Email is required") @Email(message = "Email must be valid") @Size(max = 255, message = "Email must not exceed 255 characters") String email,

                @NotBlank(message = "Password is required") @Size(min = 8, max = 128, message = "Password must be 8-128 characters") String password,

                @NotBlank(message = "First name is required") @Size(min = 1, max = 100, message = "First name must be 1-100 characters") @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "First name can only contain letters, spaces, hyphens, and apostrophes") String firstName,

                @NotBlank(message = "Last name is required") @Size(min = 1, max = 100, message = "Last name must be 1-100 characters") @Pattern(regexp = "^[a-zA-Z\\s\\-']+$", message = "Last name can only contain letters, spaces, hyphens, and apostrophes") String lastName,

                @Size(max = 20, message = "Phone number must not exceed 20 characters") @Pattern(regexp = "^[0-9\\-\\+\\s\\(\\)]*$", message = "Phone number contains invalid characters") String phoneNumber,

                @NotNull(message = "User type is required") UserType userType) {
}
