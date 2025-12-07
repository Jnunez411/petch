export type HomeType = 'APARTMENT' | 'HOUSE' | 'CONDO' | 'TOWNHOUSE' | 'OTHER';

export interface AdopterProfile {
  id?: number;
  householdSize?: number;
  hasChildren?: boolean;
  hasOtherPets?: boolean;
  homeType?: HomeType | null;
  yard?: boolean;
  fencedYard?: boolean;
  additionalNotes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AdopterProfileRequest extends Omit<AdopterProfile, 'id' | 'createdAt' | 'updatedAt'> {}
export interface AdopterProfileResponse extends AdopterProfile {}
