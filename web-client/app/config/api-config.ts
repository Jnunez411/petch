/**
 * Centralized API configuration
 * All API base URLs and image URL helpers should be imported from here
 */

export const API_BASE_URL = typeof document === 'undefined' 
    ? (import.meta.env.VITE_API_URL || 'http://localhost:8080')
    : ''; // On the client, use relative URL so Vite proxy or reverse proxy handles it

/**
 * Constructs a full URL for images stored on the backend
 * Handles both relative paths and full URLs
 */
export function getImageUrl(filePath: string | undefined | null): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${API_BASE_URL}${filePath}`;
}
