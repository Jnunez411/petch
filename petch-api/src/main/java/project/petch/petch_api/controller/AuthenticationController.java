package project.petch.petch_api.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import project.petch.petch_api.dto.auth.AuthenticationRequest;
import project.petch.petch_api.dto.auth.AuthenticationResponse;
import project.petch.petch_api.dto.auth.ForgotPasswordRequest;
import project.petch.petch_api.dto.auth.RegisterRequest;
import project.petch.petch_api.dto.auth.ResetPasswordRequest;
import project.petch.petch_api.service.AuthenticationService;
import project.petch.petch_api.service.PasswordResetService;
import project.petch.petch_api.util.LoggingUtils;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Slf4j
public class AuthenticationController {

    private final AuthenticationService authenticationService;
    private final PasswordResetService passwordResetService;

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

    /**
     * Request a password reset email
     * POST /api/auth/forgot-password
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<java.util.Map<String, String>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {
        log.info("Password reset requested for email: {}", LoggingUtils.maskEmail(request.email()));
        passwordResetService.requestPasswordReset(request.email());
        // Always return success to prevent email enumeration
        return ResponseEntity.ok(java.util.Map.of("message",
                "If an account with that email exists, we've sent a password reset link."));
    }

    /**
     * Reset password using token
     * POST /api/auth/reset-password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<java.util.Map<String, String>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {
        log.info("Password reset attempt with token");
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(java.util.Map.of("message", "Your password has been reset successfully."));
    }
}
