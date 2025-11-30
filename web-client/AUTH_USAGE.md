# Authentication Usage Guide

This guide explains how to use the session-based authentication system with `createAuthFetch`.

## Overview

The authentication system now uses secure HTTP-only cookies instead of localStorage, providing better security against XSS attacks.

## Key Functions

### Session Management

- `getSession(request)` - Get the current session from a request
- `createUserSession(request, authResponse, redirectTo)` - Create a new authenticated session
- `getUserFromSession(request)` - Get the current user from session
- `requireAuth(request)` - Require authentication, throws 401 if not authenticated
- `logout(request)` - Destroy the session and redirect to login

### Authenticated Fetch

- `createAuthFetch(session)` - Create a fetch function with automatic auth headers

## Usage Examples

### Protected Route with Loader

```typescript
import { getSession, getUserFromSession, requireAuth } from '../services/auth';
import { createAuthFetch } from '../services/authFetch.server';
import type { Route } from './+types/profile';

export async function loader({ request }: Route.LoaderArgs) {
  // Option 1: Require authentication (throws 401 if not authenticated)
  const user = await requireAuth(request);

  // Option 2: Get user if exists, but don't require
  // const user = await getUserFromSession(request);
  // if (!user) {
  //   return redirect('/login');
  // }

  // Get session for authenticated requests
  const session = await getSession(request.headers.get('Cookie'));
  const authFetch = createAuthFetch(session);

  // Make authenticated API calls
  const response = await authFetch('http://localhost:8080/api/user/profile');

  if (!response.ok) {
    throw new Error('Failed to fetch profile');
  }

  const profile = await response.json();

  return { user, profile };
}
```

### Making Authenticated API Calls in Actions

```typescript
import { getSession, requireAuth } from '../services/auth';
import { createAuthFetch } from '../services/authFetch.server';
import type { Route } from './+types/update-profile';

export async function action({ request }: Route.ActionArgs) {
  await requireAuth(request);

  const session = await getSession(request.headers.get('Cookie'));
  const authFetch = createAuthFetch(session);

  const formData = await request.formData();
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;

  const response = await authFetch('http://localhost:8080/api/user/profile', {
    method: 'PUT',
    body: JSON.stringify({ firstName, lastName }),
  });

  if (!response.ok) {
    return { error: 'Failed to update profile' };
  }

  return { success: true };
}
```

### Accessing User in Component

```typescript
import { useLoaderData } from 'react-router';
import type { Route } from './+types/profile';

export default function Profile({ loaderData }: Route.ComponentProps) {
  const { user, profile } = loaderData;

  return (
    <div>
      <h1>Welcome, {user.firstName}!</h1>
      <p>Email: {user.email}</p>
      <p>Account Type: {user.userType}</p>
    </div>
  );
}
```

## Environment Setup

Make sure you have a `SESSION_SECRET` in your `.env` file:

```bash
# Generate a secure secret
openssl rand -base64 32

# Add to .env
SESSION_SECRET=your-generated-secret-here
```

## Benefits

1. **Security**: HTTP-only cookies prevent XSS attacks
2. **Automatic**: Auth headers are added automatically with `createAuthFetch`
3. **Server-side**: Session validation happens on the server
4. **Consistent**: Same pattern across all protected routes
