export interface AdopterProfile {
  id?: number;
  householdSize?: number;
  hasChildren?: boolean;
  hasOtherPets?: boolean;
  homeType?: string;
  yard?: boolean;
  fencedYard?: boolean;
  preferredSpecies?: string;
  preferredBreeds?: string;
  minAge?: number;
  maxAge?: number;
  additionalNotes?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface AdopterProfileRequest extends Omit<AdopterProfile, 'id' | 'createdAt' | 'updatedAt'> {}
export interface AdopterProfileResponse extends AdopterProfile {}
