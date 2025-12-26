package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import project.petch.petch_api.dto.auth.AuthenticationRequest;
import project.petch.petch_api.dto.auth.AuthenticationResponse;
import project.petch.petch_api.dto.auth.RegisterRequest;
import project.petch.petch_api.exception.UserAlreadyExistsException;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final SecurityEventLogger securityEventLogger;

    /**
     * Register a new user
     * 
     * @param request registration details
     * @return authentication response with JWT token
     */
    public AuthenticationResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.email())) {
            throw new UserAlreadyExistsException("Email already registered: " + request.email());
        }

        // Create new user
        var user = new User();
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName());
        user.setLastName(request.lastName());
        user.setPhoneNumber(request.phoneNumber());
        user.setUserType(request.userType());

        // Save user to database
        userRepository.save(user);

        // Generate JWT token
        var jwtToken = jwtService.generateToken(user);

        AuthenticationResponse response = new AuthenticationResponse(jwtToken, user.getEmail(), user.getFirstName(),
                user.getLastName(), user.getUserType().name());

        // Return response
        return response;
    }

    /**
     * Authenticate existing user
     * 
     * @param request authentication credentials
     * @return authentication response with JWT token
     */
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // First check if account exists and if it's locked
        var userOptional = userRepository.findByEmail(request.email());
        if (userOptional.isPresent()) {
            User user = userOptional.get();
            if (!user.isAccountNonLocked()) {
                securityEventLogger.logEvent(
                        SecurityEventLogger.SecurityEventType.UNAUTHORIZED_ACCESS,
                        getClientIP(), request.email(), "Account is locked");
                throw new BadCredentialsException("Account is temporarily locked. Please try again later.");
            }
        }

        try {
            // Authenticate user credentials
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.email(),
                            request.password()));
        } catch (BadCredentialsException e) {
            // Log failed authentication attempt and increment failed attempts
            securityEventLogger.logFailedLogin(getClientIP(), request.email());

            // Increment failed login attempts
            userOptional.ifPresent(user -> {
                int attempts = (user.getFailedLoginAttempts() == null ? 0 : user.getFailedLoginAttempts()) + 1;
                user.setFailedLoginAttempts(attempts);

                // Lock account after 5 failed attempts for 15 minutes
                if (attempts >= 5) {
                    user.setAccountLockedUntil(java.time.LocalDateTime.now().plusMinutes(15));
                    securityEventLogger.logEvent(
                            SecurityEventLogger.SecurityEventType.UNAUTHORIZED_ACCESS,
                            getClientIP(), request.email(),
                            "Account locked after " + attempts + " failed attempts");
                }
                userRepository.save(user);
            });

            throw e;
        }

        // Fetch user from database
        // SECURITY: Use generic error message to prevent username enumeration
        var user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> {
                    securityEventLogger.logFailedLogin(getClientIP(), request.email());
                    return new BadCredentialsException("Invalid credentials");
                });

        // Reset failed login attempts on successful login
        if (user.getFailedLoginAttempts() != null && user.getFailedLoginAttempts() > 0) {
            user.setFailedLoginAttempts(0);
            user.setAccountLockedUntil(null);
            userRepository.save(user);
        }

        // Generate JWT token
        var jwtToken = jwtService.generateToken(user);

        var resp = new AuthenticationResponse(jwtToken, user.getEmail(), user.getFirstName(), user.getLastName(),
                user.getUserType().name());
        // Return response
        return resp;
    }

    /**
     * Extract client IP address from current request
     */
    private String getClientIP() {
        try {
            ServletRequestAttributes attrs = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
            if (attrs != null) {
                HttpServletRequest request = attrs.getRequest();
                String xForwardedFor = request.getHeader("X-Forwarded-For");
                if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
                    return xForwardedFor.split(",")[0].trim();
                }
                return request.getRemoteAddr();
            }
        } catch (Exception e) {
            // Ignore - return unknown
        }
        return "unknown";
    }
}
