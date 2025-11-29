import { getSession } from '../services/session.server';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface FetchOptions extends RequestInit {
  headers?: HeadersInit;
}

/**
 * Server-side authenticated fetch utility
 * Use this in loaders and actions to make authenticated API calls
 * The token is automatically retrieved from the session
 */
export async function authenticatedFetch(
  request: Request,
  endpoint: string,
  options: FetchOptions = {}
) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    throw new Response('Unauthorized', { status: 401 });
  }

  return response;
}
