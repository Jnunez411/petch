import type { Session } from './session.server';

export interface AuthFetchOptions extends RequestInit {
  headers?: HeadersInit;
}

export function createAuthFetch(session: Session) {
  const token = session.get('token');

  return async function authFetch(url: string, options: AuthFetchOptions = {}) {
    const headers = new Headers(options.headers);

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    return response;
  };
}
