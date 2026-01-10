package project.petch.petch_api.util;

/**
 * Utility class for logging operations.
 * Provides methods for masking sensitive data in log messages.
 */
public final class LoggingUtils {

    private LoggingUtils() {
        // Private constructor to prevent instantiation
    }

    /**
     * Masks an email address for logging purposes.
     * Shows first 3 characters before @ and the domain.
     * Examples:
     * - "johndoe@example.com" -> "joh***@example.com"
     * - "ab@test.com" -> "a***@test.com"
     * - null -> "***"
     *
     * @param email the email address to mask
     * @return the masked email address
     */
    public static String maskEmail(String email) {
        if (email == null || email.length() < 4) {
            return "***";
        }
        int atIndex = email.indexOf('@');
        if (atIndex < 0) {
            // No @ found, treat as invalid email
            return "***";
        }
        if (atIndex <= 3) {
            return email.substring(0, 1) + "***" + email.substring(atIndex);
        }
        return email.substring(0, 3) + "***" + email.substring(atIndex);
    }

    /**
     * Masks an IP address for logging purposes.
     * Shows first two octets and masks the rest.
     * Example: "192.168.1.100" -> "192.168.x.x"
     *
     * @param ip the IP address to mask
     * @return the masked IP address
     */
    public static String maskIp(String ip) {
        if (ip == null || ip.equals("unknown")) {
            return "unknown";
        }
        String[] parts = ip.split("\\.");
        if (parts.length == 4) {
            return parts[0] + "." + parts[1] + ".x.x";
        }
        // IPv6 or invalid format - mask most of it
        return ip.length() > 8 ? ip.substring(0, 8) + "***" : ip;
    }

    /**
     * Truncates a long string for logging purposes.
     * 
     * @param str       the string to truncate
     * @param maxLength maximum length before truncation
     * @return the truncated string with "..." suffix if truncated
     */
    public static String truncate(String str, int maxLength) {
        if (str == null) {
            return null;
        }
        if (str.length() <= maxLength) {
            return str;
        }
        return str.substring(0, maxLength) + "...";
    }
}
