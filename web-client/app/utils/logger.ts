/**
 * Centralized Logging Utility for Petch Web Client
 * 
 * Best Practices Implemented:
 * - Log levels (DEBUG, INFO, WARN, ERROR)
 * - Structured logging with context
 * - Environment-aware (dev vs prod)
 * - Namespace support for filtering
 * - Performance timing utilities
 * - User action tracking
 * - API call logging
 * - Error boundary integration
 */

// Log levels in order of severity
export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    NONE = 4, // Disable all logging
}

// Log entry structure for consistent formatting
interface LogEntry {
    timestamp: string;
    level: keyof typeof LogLevel;
    namespace: string;
    message: string;
    data?: unknown;
    userId?: string;
    sessionId?: string;
}

// Configuration
interface LoggerConfig {
    minLevel: LogLevel;
    enableConsole: boolean;
    enableTimestamps: boolean;
    enableColors: boolean;
}

// Default configuration based on environment
const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;

const defaultConfig: LoggerConfig = {
    minLevel: isDev ? LogLevel.DEBUG : LogLevel.WARN,
    enableConsole: true,
    enableTimestamps: true,
    enableColors: true,
};

// ANSI colors for terminal (also work in most browser consoles)
const colors = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m',  // Green
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
    RESET: '\x1b[0m',
};

// Browser console styling
const consoleStyles = {
    DEBUG: 'color: #00bcd4; font-weight: bold;',
    INFO: 'color: #4caf50; font-weight: bold;',
    WARN: 'color: #ff9800; font-weight: bold;',
    ERROR: 'color: #f44336; font-weight: bold;',
    NAMESPACE: 'color: #9e9e9e; font-style: italic;',
    TIMESTAMP: 'color: #757575; font-size: 0.85em;',
};

// Session tracking
let sessionId: string | null = null;
let userId: string | null = null;

/**
 * Generate a unique session ID for log correlation
 */
function generateSessionId(): string {
    return `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get or create session ID
 */
function getSessionId(): string {
    if (!sessionId) {
        if (typeof window !== 'undefined' && window.sessionStorage) {
            sessionId = sessionStorage.getItem('petch_log_session');
            if (!sessionId) {
                sessionId = generateSessionId();
                sessionStorage.setItem('petch_log_session', sessionId);
            }
        } else {
            sessionId = generateSessionId();
        }
    }
    return sessionId;
}

/**
 * Get current timestamp in ISO format
 */
function getTimestamp(): string {
    return new Date().toISOString();
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry, config: LoggerConfig): string {
    const parts: string[] = [];

    if (config.enableTimestamps) {
        parts.push(`[${entry.timestamp}]`);
    }

    parts.push(`[${entry.level}]`);
    parts.push(`[${entry.namespace}]`);
    parts.push(entry.message);

    return parts.join(' ');
}

/**
 * Output log to console with styling
 */
function outputToConsole(entry: LogEntry, config: LoggerConfig): void {
    if (!config.enableConsole) return;

    const level = entry.level;
    const consoleMethod = level === 'ERROR' ? console.error
        : level === 'WARN' ? console.warn
            : level === 'DEBUG' ? console.debug
                : console.log;

    if (typeof window !== 'undefined' && config.enableColors) {
        // Browser with styled console
        const styleLevel = level as 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
        const prefix = `%c[${entry.level}]%c [${entry.namespace}]`;
        const styles = [consoleStyles[styleLevel], consoleStyles.NAMESPACE];

        if (entry.data !== undefined) {
            consoleMethod(prefix, ...styles, entry.message, entry.data);
        } else {
            consoleMethod(prefix, ...styles, entry.message);
        }
    } else {
        // Node.js / SSR environment
        const message = formatLogEntry(entry, config);
        if (entry.data !== undefined) {
            consoleMethod(message, entry.data);
        } else {
            consoleMethod(message);
        }
    }
}

/**
 * Core logging function
 */
function log(
    level: keyof typeof LogLevel,
    namespace: string,
    message: string,
    data?: unknown,
    config: LoggerConfig = defaultConfig
): void {
    if (LogLevel[level] < config.minLevel) return;

    const entry: LogEntry = {
        timestamp: getTimestamp(),
        level,
        namespace,
        message,
        data,
        userId: userId ?? undefined,
        sessionId: getSessionId(),
    };

    outputToConsole(entry, config);
}

/**
 * Create a namespaced logger instance
 * This is the recommended way to use the logger - create one per module/component
 * 
 * @example
 * const logger = createLogger('AuthService');
 * logger.info('User logged in', { userId: '123' });
 */
export function createLogger(namespace: string, customConfig?: Partial<LoggerConfig>) {
    // Merge custom config but use getter for minLevel to allow dynamic changes
    const getEffectiveConfig = (): LoggerConfig => {
        // If custom minLevel was provided, use it; otherwise use global
        const customMinLevel = customConfig?.minLevel;
        return {
            ...defaultConfig,
            ...customConfig,
            minLevel: customMinLevel !== undefined ? customMinLevel : defaultConfig.minLevel,
        };
    };

    return {
        debug: (message: string, data?: unknown) => log('DEBUG', namespace, message, data, getEffectiveConfig()),
        info: (message: string, data?: unknown) => log('INFO', namespace, message, data, getEffectiveConfig()),
        warn: (message: string, data?: unknown) => log('WARN', namespace, message, data, getEffectiveConfig()),
        error: (message: string, data?: unknown) => log('ERROR', namespace, message, data, getEffectiveConfig()),

        /**
         * Log a user action (clicks, form submissions, navigation)
         */
        action: (actionName: string, details?: unknown) => {
            log('INFO', `${namespace}:Action`, actionName, details, getEffectiveConfig());
        },

        /**
         * Log API request start
         */
        apiRequest: (method: string, endpoint: string, body?: unknown) => {
            log('DEBUG', `${namespace}:API`, `${method} ${endpoint}`, body, getEffectiveConfig());
        },

        /**
         * Log API response
         */
        apiResponse: (method: string, endpoint: string, status: number, duration?: number) => {
            const level = status >= 400 ? 'ERROR' : status >= 300 ? 'WARN' : 'DEBUG';
            const msg = `${method} ${endpoint} → ${status}${duration ? ` (${duration}ms)` : ''}`;
            log(level, `${namespace}:API`, msg, undefined, getEffectiveConfig());
        },

        /**
         * Log component lifecycle events
         */
        lifecycle: (event: 'mount' | 'unmount' | 'update' | 'render', details?: unknown) => {
            log('DEBUG', `${namespace}:Lifecycle`, event, details, getEffectiveConfig());
        },

        /**
         * Time an async operation
         */
        time: async <T>(label: string, operation: () => Promise<T>): Promise<T> => {
            const config = getEffectiveConfig();
            const start = performance.now();
            log('DEBUG', `${namespace}:Timer`, `${label} started`, undefined, config);

            try {
                const result = await operation();
                const duration = Math.round(performance.now() - start);
                log('DEBUG', `${namespace}:Timer`, `${label} completed`, { duration: `${duration}ms` }, config);
                return result;
            } catch (error) {
                const duration = Math.round(performance.now() - start);
                log('ERROR', `${namespace}:Timer`, `${label} failed`, { duration: `${duration}ms`, error }, config);
                throw error;
            }
        },

        /**
         * Create a child logger with extended namespace
         */
        child: (childNamespace: string) => createLogger(`${namespace}:${childNamespace}`, customConfig),
    };
}

// =====================================
// Global Logger Configuration
// =====================================

/**
 * Set the current user ID for log correlation
 */
export function setLoggerUserId(id: string | null): void {
    userId = id;
}

/**
 * Update global logger configuration
 */
export function configureLogger(config: Partial<LoggerConfig>): void {
    Object.assign(defaultConfig, config);
}

/**
 * Set minimum log level (useful for runtime debugging)
 */
export function setLogLevel(level: LogLevel): void {
    defaultConfig.minLevel = level;
}

// =====================================
// Pre-built Loggers for Common Use Cases
// =====================================

/** Logger for authentication operations */
export const authLogger = createLogger('Auth');

/** Logger for API/network operations */
export const apiLogger = createLogger('API');

/** Logger for routing/navigation */
export const routeLogger = createLogger('Router');

/** Logger for user interactions */
export const uiLogger = createLogger('UI');

/** Logger for state management */
export const stateLogger = createLogger('State');

/** Logger for performance monitoring */
export const perfLogger = createLogger('Performance');

// =====================================
// React-specific Utilities
// =====================================

/**
 * Hook for component-level logging
 * Creates a logger with the component name as namespace
 * 
 * @example
 * function MyComponent() {
 *   const log = useLogger('MyComponent');
 *   log.info('Rendered with props', props);
 * }
 */
export function useComponentLogger(componentName: string) {
    return createLogger(`Component:${componentName}`);
}

// =====================================
// Error Boundary Helper
// =====================================

/**
 * Log caught errors from error boundaries
 */
export function logErrorBoundary(
    error: Error,
    errorInfo: { componentStack?: string },
    componentName?: string
): void {
    const logger = createLogger(componentName ? `ErrorBoundary:${componentName}` : 'ErrorBoundary');
    logger.error('Component error caught', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
    });
}

// =====================================
// Development Helpers
// =====================================

/**
 * Enable verbose logging (DEBUG level) - call from browser console
 * window.enableVerboseLogging()
 */
if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>).enableVerboseLogging = () => {
        setLogLevel(LogLevel.DEBUG);
        console.log('🔧 Verbose logging enabled (DEBUG level)');
    };

    (window as unknown as Record<string, unknown>).disableVerboseLogging = () => {
        setLogLevel(LogLevel.WARN);
        console.log('🔧 Verbose logging disabled (WARN level only)');
    };

    (window as unknown as Record<string, unknown>).setLogLevel = (level: keyof typeof LogLevel) => {
        setLogLevel(LogLevel[level]);
        console.log(`🔧 Log level set to ${level}`);
    };
}

// Default export for convenience
export default createLogger;
