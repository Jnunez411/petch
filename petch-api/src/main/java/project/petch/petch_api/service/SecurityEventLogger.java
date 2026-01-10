package project.petch.petch_api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

/**
 * Centralized security event logging service.
 * Logs security-relevant events in a consistent format for monitoring and
 * auditing.
 */
@Service
public class SecurityEventLogger {

    private static final Logger logger = LoggerFactory.getLogger(SecurityEventLogger.class);

    public enum SecurityEventType {
        FAILED_LOGIN,
        RATE_LIMIT_EXCEEDED,
        IDOR_ATTEMPT,
        UNAUTHORIZED_ACCESS,
        BUCKET_CLEANUP
    }

    /**
     * Log a security event with details.
     * Format: SECURITY_EVENT | type=<TYPE> | ip=<IP> | user=<USER> |
     * details=<DETAILS>
     */
    public void logEvent(SecurityEventType type, String ipAddress, String userIdentifier, String details) {
        String logMessage = String.format(
                "SECURITY_EVENT | type=%s | ip=%s | user=%s | details=%s",
                type.name(),
                ipAddress != null ? ipAddress : "unknown",
                userIdentifier != null ? userIdentifier : "anonymous",
                details != null ? details : "none");

        switch (type) {
            case FAILED_LOGIN, RATE_LIMIT_EXCEEDED, IDOR_ATTEMPT, UNAUTHORIZED_ACCESS:
                logger.warn(logMessage);
                break;
            case BUCKET_CLEANUP:
                logger.info(logMessage);
                break;
            default:
                logger.info(logMessage);
        }
    }

    /**
     * Log a failed login attempt.
     */
    public void logFailedLogin(String ipAddress, String email) {
        logEvent(SecurityEventType.FAILED_LOGIN, ipAddress, email, "Failed authentication attempt");
    }

    /**
     * Log a rate limit violation.
     */
    public void logRateLimitExceeded(String ipAddress, String endpoint) {
        logEvent(SecurityEventType.RATE_LIMIT_EXCEEDED, ipAddress, null, "Rate limit exceeded for: " + endpoint);
    }

    /**
     * Log an IDOR (Insecure Direct Object Reference) attempt.
     */
    public void logIdorAttempt(String ipAddress, String userId, String resourceType, Long resourceId) {
        String details = String.format("Unauthorized %s access attempt on ID: %d", resourceType, resourceId);
        logEvent(SecurityEventType.IDOR_ATTEMPT, ipAddress, userId, details);
    }

    /**
     * Log bucket cleanup event.
     */
    public void logBucketCleanup(int removedCount) {
        logEvent(SecurityEventType.BUCKET_CLEANUP, "system", "system",
                String.format("Cleaned up %d stale rate limit buckets", removedCount));
    }
}
