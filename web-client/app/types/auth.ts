export type UserType = 'ADOPTER' | 'VENDOR' | 'ADMIN';

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  userType: UserType;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
}

export interface User {
  email: string;
  firstName: string;
  lastName: string;
  userType: string;
}

/** Extended user type for admin management pages */
export interface AdminUser extends User {
  id: number;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
}
