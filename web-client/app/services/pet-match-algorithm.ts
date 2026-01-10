import { API_BASE_URL } from '~/config/api-config';
import type { Pet, UserPreferences } from '~/types/pet';
import { createLogger } from '~/utils/logger';

const logger = createLogger('PetMatch');

// Re-export for convenience
export type { UserPreferences } from '~/types/pet';

// Fetch recommended pets from backend
export async function discoverPets(token: string): Promise<Pet[]> {
    const startTime = performance.now();
    logger.debug('Fetching discover pets');

    const response = await fetch(`${API_BASE_URL}/api/pets/discover`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const duration = Math.round(performance.now() - startTime);

    if (!response.ok) {
        logger.error('Failed to fetch discover pets', { status: response.status, duration: `${duration}ms` });
        throw new Error('Failed to fetch discover pets');
    }

    const pets = await response.json();
    logger.info('Discover pets loaded', { count: pets.length, duration: `${duration}ms` });
    return pets;
}

// Record a swipe (LIKE or PASS) on the backend
export async function recordInteraction(
    petId: number,
    type: 'LIKE' | 'PASS',
    token: string
): Promise<void> {
    logger.action(`Pet ${type}`, { petId });

    const response = await fetch(`${API_BASE_URL}/api/pets/${petId}/interact`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
    });

    if (!response.ok) {
        logger.error('Failed to record interaction', { petId, type, status: response.status });
        throw new Error('Failed to record interaction');
    }

    logger.debug('Interaction recorded successfully', { petId, type });
}

// Undo a swipe (interaction)
export async function undoInteraction(
    petId: number,
    token: string
): Promise<void> {
    logger.action('Undo interaction', { petId });

    const response = await fetch(`${API_BASE_URL}/api/pets/${petId}/interact`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        logger.error('Failed to undo interaction', { petId, status: response.status });
        throw new Error('Failed to undo interaction');
    }

    logger.debug('Interaction undone successfully', { petId });
}

// Fetch user's liked pets from backend
export async function fetchLikedPets(token: string): Promise<Pet[]> {
    const startTime = performance.now();
    logger.debug('Fetching liked pets');

    const response = await fetch(`${API_BASE_URL}/api/pets/liked`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    const duration = Math.round(performance.now() - startTime);

    if (!response.ok) {
        logger.error('Failed to fetch liked pets', { status: response.status, duration: `${duration}ms` });
        throw new Error('Failed to fetch liked pets');
    }

    const pets = await response.json();
    logger.info('Liked pets loaded', { count: pets.length, duration: `${duration}ms` });
    return pets;
}

// Helper to get liked pets (could also be an API call, but for now we can filter)
export function getLikedPets(allPets: Pet[], preferences: UserPreferences): Pet[] {
    const likedSet = new Set(preferences.likedPetIds);
    return allPets.filter(pet => likedSet.has(pet.id));
}

