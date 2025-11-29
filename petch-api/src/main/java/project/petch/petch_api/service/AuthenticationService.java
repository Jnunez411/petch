package project.petch.petch_api.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import project.petch.petch_api.Entity.User;
import project.petch.petch_api.dto.AuthenticationRequest;
import project.petch.petch_api.dto.AuthenticationResponse;
import project.petch.petch_api.dto.RegisterRequest;
import project.petch.petch_api.repositories.UserRepository;

@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    /**
     * Register a new user
     * @param request registration details
     * @return authentication response with JWT token
     */
    public AuthenticationResponse register(RegisterRequest request) {
        // Check if user already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new RuntimeException("Email already registered");
        }

        // Create new user
        var user = new User();
        user.setEmail(request.getEmail());
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setUserType(request.getUserType());

        // Save user to database
        userRepository.save(user);

        // Generate JWT token
        var jwtToken = jwtService.generateToken(user);

        // Return response
        return AuthenticationResponse.builder()
                .token(jwtToken)
                .email(user.getEmail())
                .firstName(user.getFirstName())
                .lastName(user.getLastName())
                .userType(user.getUserType().name())
                .build();
    }

    /**
     * Authenticate existing user
     * @param request authentication credentials
     * @return authentication response with JWT token
     */
    public AuthenticationResponse authenticate(AuthenticationRequest request) {
        // Authenticate user credentials
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        request.email(),
                        request.password()
                )
        );

        // Fetch user from database
        var user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Generate JWT token
        var jwtToken = jwtService.generateToken(user);

        var resp = new AuthenticationResponse(jwtToken, user.getEmail(), user.getFirstName(), user.getLastName(), user.getUserType().name());
        // Return response
        return resp;
    }
}
