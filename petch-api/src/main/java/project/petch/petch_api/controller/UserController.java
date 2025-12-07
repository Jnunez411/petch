package project.petch.petch_api.controller;

import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import project.petch.petch_api.models.User;

import java.util.HashMap;
import java.util.Map;

/**
 * User Controller - Protected Endpoints
 * These endpoints require authentication (valid JWT token)
 */
@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@CrossOrigin(origins = "${cors.allowed-origins:http://localhost:3000,http://localhost:5173}")
public class UserController {

    /**
     * Get current authenticated user's profile
     * GET /api/users/me
     *
     * This endpoint demonstrates how to get the current authenticated user
     */
    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> getCurrentUser() {
        // Get the current authentication from security context
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        // The principal is the User object (from UserDetails)
        User currentUser = (User) authentication.getPrincipal();

        // Prepare response
        Map<String, Object> response = new HashMap<>();
        response.put("id", currentUser.getId());
        response.put("email", currentUser.getEmail());
        response.put("firstName", currentUser.getFirstName());
        response.put("lastName", currentUser.getLastName());
        response.put("userType", currentUser.getUserType().name());
        response.put("phoneNumber", currentUser.getPhoneNumber());
        response.put("createdAt", currentUser.getCreatedAt());

        return ResponseEntity.ok(response);
    }

    /**
     * Simple health check for authenticated users
     * GET /api/users/test
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> testAuthentication() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        User currentUser = (User) authentication.getPrincipal();

        Map<String, String> response = new HashMap<>();
        response.put("message", "Authentication successful!");
        response.put("user", currentUser.getEmail());
        response.put("role", currentUser.getUserType().name());

        return ResponseEntity.ok(response);
    }
}
