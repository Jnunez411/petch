const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Note: Weights are now handled backend, but we keep the types for compatibility
export interface UserPreferences {
    likedPetIds: number[];
    passedPetIds: number[];
    totalSwipes: number;
}

// Fetch recommended pets from backend
export async function discoverPets(token: string): Promise<any[]> {
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

// Fetch user's liked pets from backend
export async function fetchLikedPets(token: string): Promise<any[]> {
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
export function getLikedPets(allPets: any[], preferences: UserPreferences): any[] {
    const likedSet = new Set(preferences.likedPetIds);
    return allPets.filter(pet => likedSet.has(pet.id));
}
