import type { RegisterRequest, LoginRequest, AuthResponse, User } from '../types/auth';
import { getSession, commitSession, destroySession } from './session.server';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/auth';

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    throw new Error(error.message || 'Registration failed');
  }

  return response.json();
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    throw new Error(error.message || 'Login failed');
  }

  return response.json();
}

// Session-based helpers
export async function createUserSession(
  request: Request,
  authResponse: AuthResponse,
  redirectTo: string
) {
  const session = await getSession(request.headers.get('Cookie'));

  session.set('token', authResponse.token);
  session.set('user', {
    email: authResponse.email,
    firstName: authResponse.firstName,
    lastName: authResponse.lastName,
    userType: authResponse.userType,
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: redirectTo,
      'Set-Cookie': await commitSession(session),
    },
  });
}

export async function getUserFromSession(request: Request): Promise<User | null> {
  const session = await getSession(request.headers.get('Cookie'));
  const user = session.get('user');
  return user || null;
}

export async function requireAuth(request: Request): Promise<User> {
  const user = await getUserFromSession(request);

  if (!user) {
    throw new Response('Unauthorized', { status: 401 });
  }

  return user;
}

export async function logout(request: Request) {
  const session = await getSession(request.headers.get('Cookie'));

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/login',
      'Set-Cookie': await destroySession(session),
    },
  });
}

export { getSession, commitSession, destroySession };
