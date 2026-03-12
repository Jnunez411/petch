// Standard adoption fee tiers (in cents)
export const ADOPTION_FEES = {
  SMALL: 2500,   // $25
  MEDIUM: 5000,  // $50
  LARGE: 7500,   // $75
  PREMIUM: 10000, // $100
} as const;

export type AdoptionFeeKey = keyof typeof ADOPTION_FEES;

/**
 * Get adoption fee based on pet characteristics.
 * Can be extended to consider pet size, age, breed, etc.
 */
export function getAdoptionFee(petName?: string): number {
  // Default to medium fee - customize based on your business logic
  return ADOPTION_FEES.MEDIUM;
}
