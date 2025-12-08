import { createCookieSessionStorage } from 'react-router';
import type { Session } from 'react-router';

// Ensure SESSION_SECRET is set in production
if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET environment variable must be set in production');
}

type SessionData = {
  token: string;
  user: {
    email: string;
    firstName: string;
    lastName: string;
    userType: string;
  };
};

type SessionFlashData = {
  error: string;
};

const { getSession, commitSession, destroySession } = createCookieSessionStorage<
  SessionData,
  SessionFlashData
>({
  cookie: {
    name: '__session',
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
    sameSite: 'lax',
    secrets: [process.env.SESSION_SECRET || 'dev-secret-not-for-production'],
    secure: process.env.NODE_ENV === 'production',
  },
});

export { getSession, commitSession, destroySession };
export type { Session, SessionData };
