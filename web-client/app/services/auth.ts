import type { RegisterRequest, LoginRequest, AuthResponse, User } from '../types/auth';
import { getSession, commitSession, destroySession } from './session.server';
import { authLogger } from '~/utils/logger';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
const AUTH_URL = `${API_BASE_URL}/api/auth`;

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  authLogger.info('Registration attempt', { email: data.email, userType: data.userType });
  const startTime = performance.now();

  const response = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const duration = Math.round(performance.now() - startTime);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Registration failed' }));
    authLogger.error('Registration failed', {
      email: data.email,
      status: response.status,
      error: error.message,
      duration: `${duration}ms`
    });
    throw new Error(error.message || 'Registration failed');
  }

  authLogger.info('Registration successful', { email: data.email, duration: `${duration}ms` });
  return response.json();
}

export async function login(data: LoginRequest): Promise<AuthResponse> {
  authLogger.info('Login attempt', { email: data.email });
  const startTime = performance.now();

  const response = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  const duration = Math.round(performance.now() - startTime);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Login failed' }));
    authLogger.error('Login failed', {
      email: data.email,
      status: response.status,
      error: error.message,
      duration: `${duration}ms`
    });
    throw new Error(error.message || 'Login failed');
  }

  authLogger.info('Login successful', { email: data.email, duration: `${duration}ms` });
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

export async function getAuthToken(request: Request): Promise<string | null> {
  const session = await getSession(request.headers.get('Cookie'));
  return session.get('token') || null;
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
