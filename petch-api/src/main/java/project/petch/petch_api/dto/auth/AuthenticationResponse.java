package project.petch.petch_api.dto.auth;

public record AuthenticationResponse(
        String token,
        String email,
        String firstName,
        String lastName,
        String userType) {
}
