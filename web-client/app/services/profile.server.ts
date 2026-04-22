import { authenticatedFetch } from '~/utils/api';
import type { AdopterProfileRequest, AdopterProfileResponse } from '~/types/adopter';
import type {
  VendorAdoptionPreferencesRequest,
  VendorAdoptionPreferencesResponse,
  VendorProfileRequest,
  VendorProfileResponse,
} from '~/types/vendor';

// Adopter Profile Functions

/**
 * Fetch the adopter profile for the authenticated user.
 * Returns null if profile doesn't exist (404).
 * Throws if other errors occur.
 */
export async function getAdopterProfile(request: Request): Promise<AdopterProfileResponse | null> {
  try {
    const response = await authenticatedFetch(request, '/api/v1/adopter/profile/me');
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load adopter profile (status: ${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw new Error('Failed to load adopter profile');
  }
}

/**
 * Create a new adopter profile for the authenticated user.
 * Throws if the request fails.
 */
export async function createAdopterProfile(
  request: Request,
  data: AdopterProfileRequest
): Promise<AdopterProfileResponse> {
  const response = await authenticatedFetch(request, '/api/v1/adopter/profile/me', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to create adopter profile' }));
    throw new Error(errorBody.message || 'Failed to create adopter profile');
  }

  return await response.json();
}

/**
 * Update the adopter profile for the authenticated user.
 * Throws if the request fails.
 */
export async function updateAdopterProfile(
  request: Request,
  data: AdopterProfileRequest
): Promise<AdopterProfileResponse> {
  const response = await authenticatedFetch(request, '/api/v1/adopter/profile/me', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to update adopter profile' }));
    throw new Error(errorBody.message || 'Failed to update adopter profile');
  }

  return await response.json();
}

// Vendor Profile Functions

/**
 * Fetch the vendor profile for the authenticated user.
 * Returns null if profile doesn't exist (404).
 * Throws if other errors occur.
 */
export async function getVendorProfile(request: Request): Promise<VendorProfileResponse | null> {
  try {
    const response = await authenticatedFetch(request, '/api/v1/vendor/profile/me');
    
    if (response.status === 404) {
      return null;
    }
    
    if (!response.ok) {
      throw new Error(`Failed to load vendor profile (status: ${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw new Error('Failed to load vendor profile');
  }
}

/**
 * Create a new vendor profile for the authenticated user.
 * Throws if the request fails.
 */
export async function createVendorProfile(
  request: Request,
  data: VendorProfileRequest
): Promise<VendorProfileResponse> {
  const response = await authenticatedFetch(request, '/api/v1/vendor/profile/me', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to create vendor profile' }));
    throw new Error(errorBody.message || 'Failed to create vendor profile');
  }

  return await response.json();
}

/**
 * Update the vendor profile for the authenticated user.
 * Throws if the request fails.
 */
export async function updateVendorProfile(
  request: Request,
  data: VendorProfileRequest
): Promise<VendorProfileResponse> {
  const response = await authenticatedFetch(request, '/api/v1/vendor/profile/me', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to update vendor profile' }));
    throw new Error(errorBody.message || 'Failed to update vendor profile');
  }

  return await response.json();
}

/**
 * Fetch vendor adoption preferences for the authenticated user.
 * Returns null if preferences do not exist yet.
 */
export async function getVendorAdoptionPreferences(
  request: Request
): Promise<VendorAdoptionPreferencesResponse | null> {
  try {
    const response = await authenticatedFetch(request, '/api/v1/vendor/adoption-preferences/me');

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`Failed to load vendor adoption preferences (status: ${response.status})`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof Error && error.message.includes('404')) {
      return null;
    }
    throw new Error('Failed to load vendor adoption preferences');
  }
}

export async function createVendorAdoptionPreferences(
  request: Request,
  data: VendorAdoptionPreferencesRequest
): Promise<VendorAdoptionPreferencesResponse> {
  const response = await authenticatedFetch(request, '/api/v1/vendor/adoption-preferences/me', {
    method: 'POST',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to create vendor adoption preferences' }));
    throw new Error(errorBody.message || 'Failed to create vendor adoption preferences');
  }

  return await response.json();
}

export async function updateVendorAdoptionPreferences(
  request: Request,
  data: VendorAdoptionPreferencesRequest
): Promise<VendorAdoptionPreferencesResponse> {
  const response = await authenticatedFetch(request, '/api/v1/vendor/adoption-preferences/me', {
    method: 'PUT',
    body: JSON.stringify(data),
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Failed to update vendor adoption preferences' }));
    throw new Error(errorBody.message || 'Failed to update vendor adoption preferences');
  }

  return await response.json();
}

export async function uploadVendorAdoptionPreferencesPdf(
  request: Request,
  file: File
): Promise<VendorAdoptionPreferencesResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await authenticatedFetch(request, '/api/v1/vendor/adoption-preferences/me/online-form-pdf', {
    method: 'POST',
    body: formData,
  });

  return await response.json();
}

export async function deleteVendorAdoptionPreferencesPdf(request: Request): Promise<void> {
  const response = await authenticatedFetch(request, '/api/v1/vendor/adoption-preferences/me/online-form-pdf', {
    method: 'DELETE',
  });

  if (!response.ok && response.status !== 404) {
    throw new Error('Failed to remove the preset PDF.');
  }
}
