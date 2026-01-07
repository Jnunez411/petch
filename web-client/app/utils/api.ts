import { getSession } from '../services/session.server';
import { API_BASE_URL } from '~/config/api-config';
import { apiLogger } from '~/utils/logger';

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

  const method = options.method || 'GET';
  const startTime = performance.now();

  apiLogger.debug(`Request: ${method} ${endpoint}`, {
    hasAuth: !!token,
    body: options.body ? '[present]' : undefined
  });

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const duration = Math.round(performance.now() - startTime);

  if (response.status === 401) {
    apiLogger.warn(`Unauthorized: ${method} ${endpoint}`, { duration: `${duration}ms` });
    throw new Response('Unauthorized', { status: 401 });
  }

  if (!response.ok) {
    apiLogger.error(`Request failed: ${method} ${endpoint}`, {
      status: response.status,
      duration: `${duration}ms`
    });
  } else {
    apiLogger.debug(`Response: ${method} ${endpoint}`, {
      status: response.status,
      duration: `${duration}ms`
    });
  }

  return response;
}
