/**
 * Application-wide constants
 * Extracted magic numbers for better maintainability
 */

// ============================================
// Validation Limits
// ============================================

/** Maximum age for a pet in years */
export const MAX_PET_AGE = 30;

/** Maximum length for pet/user names */
export const MAX_NAME_LENGTH = 100;

/** Minimum length for names */
export const MIN_NAME_LENGTH = 2;

/** Maximum adoption fee in dollars */
export const MAX_ADOPTION_FEE = 10000;

/** Minimum digits required for a valid phone number */
export const MIN_PHONE_DIGITS = 10;

/** Maximum digits for a phone number */
export const MAX_PHONE_DIGITS = 15;

/** Minimum length for adoption steps description */
export const MIN_STEPS_LENGTH = 20;

/** Maximum file size for image uploads (5MB) */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

// ============================================
// Animation Durations (milliseconds)
// ============================================

/** Standard swipe animation duration */
export const SWIPE_ANIMATION_DURATION = 300;

/** Undo animation duration */
export const UNDO_ANIMATION_DURATION = 500;

/** Card transition animation */
export const CARD_TRANSITION_DURATION = 600;

// ============================================
// Placeholder Images
// ============================================

export const PLACEHOLDER_IMAGES: Record<string, string> = {
    Dog: 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=600&fit=crop',
    Cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=600&fit=crop',
    Bird: 'https://images.unsplash.com/photo-1522926193341-e9ffd6a399b6?w=600&h=600&fit=crop',
    Other: 'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=600&h=600&fit=crop',
    default: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=600&h=600&fit=crop',
};
