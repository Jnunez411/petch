package project.petch.petch_api.service;

import java.time.LocalDateTime;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import project.petch.petch_api.models.PasswordResetToken;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.PasswordResetTokenRepository;
import project.petch.petch_api.repositories.UserRepository;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.password-reset.token-expiry-minutes:30}")
    private int tokenExpiryMinutes;

    @Value("${app.password-reset.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Transactional
    public void requestPasswordReset(String email) {
        var userOptional = userRepository.findByEmail(email);

        if (userOptional.isEmpty()) {
            // Don't reveal whether the email exists - always return success
            log.debug("Password reset requested for non-existent email");
            return;
        }

        User user = userOptional.get();

        // Invalidate any existing tokens for this user
        tokenRepository.deleteByUserId(user.getId());

        // Generate a new token
        String token = UUID.randomUUID().toString();
        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.setToken(token);
        resetToken.setUser(user);
        resetToken.setExpiresAt(LocalDateTime.now().plusMinutes(tokenExpiryMinutes));
        tokenRepository.save(resetToken);

        // Send reset email
        String resetLink = frontendUrl + "/reset-password?token=" + token;
        emailService.sendPasswordResetEmail(user.getEmail(), resetLink);

        log.info("Password reset token generated for user: {}", user.getEmail().replaceAll("(?<=.{3}).(?=.*@)", "*"));
    }

    @Transactional
    public void resetPassword(String token, String newPassword) {
        PasswordResetToken resetToken = tokenRepository.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid or expired reset link."));

        if (resetToken.isUsed()) {
            throw new IllegalArgumentException("This reset link has already been used.");
        }

        if (resetToken.isExpired()) {
            throw new IllegalArgumentException("This reset link has expired. Please request a new one.");
        }

        // Update the user's password
        User user = resetToken.getUser();
        user.setPasswordHash(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark token as used
        resetToken.setUsed(true);
        tokenRepository.save(resetToken);

        log.info("Password successfully reset for user: {}",
                user.getEmail().replaceAll("(?<=.{3}).(?=.*@)", "*"));
    }
}
