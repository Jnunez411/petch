export interface VendorProfile {
  id?: number;
  organizationName: string;
  profileImageUrl?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  description?: string;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorProfileRequest {
  organizationName: string;
  websiteUrl?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  description?: string;
}

export interface VendorProfileResponse extends VendorProfile { }

export type AdoptionContactMethod = 'DIRECT_LINK' | 'CONTACT_NUMBER' | 'ONLINE_FORM';

export interface VendorAdoptionPreferences {
  id?: number;
  useShelterLocation: boolean;
  longitude?: number | null;
  latitude?: number | null;
  contactMethod: AdoptionContactMethod;
  directLinkUrl?: string;
  contactNumber?: string;
  stepsDescription?: string;
  phoneNumber?: string;
  email?: string;
  hasOnlineFormPdf?: boolean;
  onlineFormFileName?: string;
  onlineFormContentType?: string;
  payOnline?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface VendorAdoptionPreferencesRequest {
  useShelterLocation: boolean;
  longitude?: number | null;
  latitude?: number | null;
  contactMethod: AdoptionContactMethod;
  directLinkUrl?: string;
  contactNumber?: string;
  stepsDescription?: string;
  phoneNumber?: string;
  email?: string;
  payOnline?: boolean;
}

export interface VendorAdoptionPreferencesResponse extends VendorAdoptionPreferences { }
