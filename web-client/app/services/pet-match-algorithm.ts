import { API_BASE_URL } from '~/config/api-config';
import type { Pet, UserPreferences } from '~/types/pet';

// Re-export for convenience
export type { UserPreferences } from '~/types/pet';

// Fetch recommended pets from backend
export async function discoverPets(token: string): Promise<Pet[]> {
    const response = await fetch(`${API_BASE_URL}/api/pets/discover`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch discover pets');
    }

    return response.json();
}

// Record a swipe (LIKE or PASS) on the backend
export async function recordInteraction(
    petId: number,
    type: 'LIKE' | 'PASS',
    token: string
): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/pets/${petId}/interact`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ type }),
    });

    if (!response.ok) {
        throw new Error('Failed to record interaction');
    }
}

// Undo a swipe (interaction)
export async function undoInteraction(
    petId: number,
    token: string
): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/pets/${petId}/interact`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to undo interaction');
    }
}

// Fetch user's liked pets from backend
export async function fetchLikedPets(token: string): Promise<Pet[]> {
    const response = await fetch(`${API_BASE_URL}/api/pets/liked`, {
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Failed to fetch liked pets');
    }

    return response.json();
}

// Helper to get liked pets (could also be an API call, but for now we can filter)
export function getLikedPets(allPets: Pet[], preferences: UserPreferences): Pet[] {
    const likedSet = new Set(preferences.likedPetIds);
    return allPets.filter(pet => likedSet.has(pet.id));
}

