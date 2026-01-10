/**
 * Centralized API configuration
 * All API base URLs and image URL helpers should be imported from here
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Constructs a full URL for images stored on the backend
 * Handles both relative paths and full URLs
 */
export function getImageUrl(filePath: string | undefined | null): string {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${API_BASE_URL}${filePath}`;
}
