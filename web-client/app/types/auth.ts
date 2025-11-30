export type UserType = 'ADOPTER' | 'VENDOR';

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
