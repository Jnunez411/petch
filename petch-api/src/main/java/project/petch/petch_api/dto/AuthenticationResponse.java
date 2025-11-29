package project.petch.petch_api.dto;

public record AuthenticationResponse(
    String token,
    String email,
    String firstName,
    String lastName,
    String userType
) {}
