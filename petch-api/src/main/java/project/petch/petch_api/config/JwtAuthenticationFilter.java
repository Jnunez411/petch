package project.petch.petch_api.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import project.petch.petch_api.service.JwtService;
import project.petch.petch_api.util.LoggingUtils;

import java.io.IOException;

/**
 * JWT Authentication Filter
 * This filter intercepts every HTTP request and validates JWT tokens
 * If valid, it sets the authentication in the security context
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        // Get the Authorization header
        final String authHeader = request.getHeader("Authorization");
        final String jwt;
        final String userEmail;

        // Check if header is present and starts with "Bearer "
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        // Extract the token (remove "Bearer " prefix)
        jwt = authHeader.substring(7);

        try {
            // Extract username (email) from JWT token
            userEmail = jwtService.extractUsername(jwt);

            // If we have a username and user is not already authenticated
            if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                log.debug("Processing JWT authentication for user: {}", LoggingUtils.maskEmail(userEmail));

                // Load user details from database
                UserDetails userDetails = this.userDetailsService.loadUserByUsername(userEmail);

                // Validate token
                if (jwtService.isTokenValid(jwt, userDetails)) {
                    // Create authentication token
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                            userDetails,
                            null,
                            userDetails.getAuthorities());

                    // Set additional details from request
                    authToken.setDetails(
                            new WebAuthenticationDetailsSource().buildDetails(request));

                    // Update security context with authenticated user
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    log.debug("User authenticated successfully: {}", LoggingUtils.maskEmail(userEmail));
                } else {
                    log.warn("Invalid JWT token for user: {}", LoggingUtils.maskEmail(userEmail));
                }
            }
        } catch (Exception e) {
            // If token is invalid, log and continue without authentication
            // This allows the request to proceed but as unauthenticated
            // Spring Security will handle blocking access to protected endpoints
            log.warn("JWT validation error: {}", e.getMessage());
        }

        // Continue with the filter chain
        filterChain.doFilter(request, response);
    }
}
