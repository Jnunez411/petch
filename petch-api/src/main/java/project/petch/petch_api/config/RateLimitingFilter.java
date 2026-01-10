package project.petch.petch_api.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.annotation.Order;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import project.petch.petch_api.service.SecurityEventLogger;

import java.io.IOException;
import java.time.Duration;
import java.util.Iterator;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Rate limiting filter for sensitive endpoints.
 * Prevents brute force attacks and abuse by limiting requests per IP address.
 * 
 * Rate limits:
 * - Authentication endpoints (/api/auth/*): 10 requests/minute
 * - Image upload endpoints: 5 requests/minute
 * 
 * Includes automatic cleanup of stale buckets every 5 minutes.
 */
@Component
@Order(1)
public class RateLimitingFilter extends OncePerRequestFilter {

    // Store rate limit buckets per IP address with timestamps
    private final Map<String, BucketEntry> buckets = new ConcurrentHashMap<>();

    // Configuration constants
    private static final int AUTH_REQUESTS_PER_MINUTE = 5;
    private static final int UPLOAD_REQUESTS_PER_MINUTE = 5;
    private static final long BUCKET_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

    private SecurityEventLogger securityEventLogger;

    @Autowired
    public void setSecurityEventLogger(SecurityEventLogger securityEventLogger) {
        this.securityEventLogger = securityEventLogger;
    }

    /**
     * Inner record to track bucket and last access time.
     */
    private record BucketEntry(Bucket bucket, long lastAccessTime) {
        public BucketEntry withUpdatedTime() {
            return new BucketEntry(this.bucket, System.currentTimeMillis());
        }
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();
        String clientIp = getClientIP(request);

        // Apply rate limiting based on endpoint type
        if (path.startsWith("/api/auth/")) {
            if (!checkRateLimit(clientIp, "auth", AUTH_REQUESTS_PER_MINUTE, path, response)) {
                return;
            }
        } else if (path.contains("/upload-image")) {
            if (!checkRateLimit(clientIp, "upload", UPLOAD_REQUESTS_PER_MINUTE, path, response)) {
                return;
            }
        }

        // Request allowed - proceed with filter chain
        filterChain.doFilter(request, response);
    }

    /**
     * Check rate limit for a specific endpoint type.
     * 
     * @return true if request is allowed, false if rate limited
     */
    private boolean checkRateLimit(String clientIp, String endpointType, int limit, String path,
            HttpServletResponse response)
            throws IOException {
        String bucketKey = clientIp + ":" + endpointType;

        BucketEntry entry = buckets.compute(bucketKey, (key, existing) -> {
            if (existing == null) {
                return new BucketEntry(createNewBucket(limit), System.currentTimeMillis());
            }
            return existing.withUpdatedTime();
        });

        if (entry.bucket().tryConsume(1)) {
            return true;
        } else {
            // Rate limit exceeded - log and return 429
            if (securityEventLogger != null) {
                securityEventLogger.logRateLimitExceeded(clientIp, path);
            }
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter()
                    .write("{\"message\":\"Too many requests. Please try again later.\",\"status\":429}");
            return false;
        }
    }

    /**
     * Create a new rate limit bucket.
     * 
     * @param requestsPerMinute number of requests allowed per minute
     */
    private Bucket createNewBucket(int requestsPerMinute) {
        Bandwidth limit = Bandwidth.classic(
                requestsPerMinute,
                Refill.greedy(requestsPerMinute, Duration.ofMinutes(1)));
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Scheduled cleanup of stale rate limit buckets.
     * Runs every 5 minutes to prevent memory leaks from abandoned IPs.
     */
    @Scheduled(fixedRate = 300000) // Every 5 minutes
    public void cleanupStaleBuckets() {
        long now = System.currentTimeMillis();
        int removedCount = 0;

        Iterator<Map.Entry<String, BucketEntry>> iterator = buckets.entrySet().iterator();
        while (iterator.hasNext()) {
            Map.Entry<String, BucketEntry> entry = iterator.next();
            if (now - entry.getValue().lastAccessTime() > BUCKET_EXPIRY_MS) {
                iterator.remove();
                removedCount++;
            }
        }

        if (removedCount > 0 && securityEventLogger != null) {
            securityEventLogger.logBucketCleanup(removedCount);
        }
    }

    /**
     * Extract client IP address, handling proxies.
     */
    private String getClientIP(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            // Get first IP if there are multiple
            return xForwardedFor.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
