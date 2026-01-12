package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import project.petch.petch_api.dto.auth.AuthenticationRequest;
import project.petch.petch_api.dto.auth.AuthenticationResponse;
import project.petch.petch_api.dto.auth.RegisterRequest;
import project.petch.petch_api.service.AuthenticationService;
import project.petch.petch_api.util.LoggingUtils;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    /**
     * Register a new user
     * POST /api/auth/register
     */
    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        log.info("Registration attempt for email: {}", LoggingUtils.maskEmail(request.email()));
        AuthenticationResponse response = authenticationService.register(request);
        log.info("User registered successfully: {}", LoggingUtils.maskEmail(request.email()));
        return ResponseEntity.ok(response);
    }

    /**
     * Login existing user
     * POST /api/auth/login
     */
    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(
            @Valid @RequestBody AuthenticationRequest request) {
        log.info("Login attempt for email: {}", LoggingUtils.maskEmail(request.email()));
        AuthenticationResponse response = authenticationService.authenticate(request);
        log.info("User logged in successfully: {}", LoggingUtils.maskEmail(request.email()));
        return ResponseEntity.ok(response);
    }
}
