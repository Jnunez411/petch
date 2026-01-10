export interface VendorProfile {
  id?: number;
  organizationName: string;
  profileImageUrl?: string;
  websiteUrl?: string;
  phoneNumber?: string;
  city?: string;
  state?: string;
  description?: string;
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
