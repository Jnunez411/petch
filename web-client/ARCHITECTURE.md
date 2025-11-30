# Frontend Architecture Documentation

## Overview

This frontend is built with React Router v7 and follows modern best practices including:
- Server-Side Rendering (SSR)
- Progressive Enhancement with Form Actions
- Loaders for data fetching
- Reusable UI components
- Type-safe API calls

## Project Structure

```
app/
├── components/           # Reusable components
│   ├── ui/              # UI primitives
│   │   ├── Input.tsx
│   │   ├── Button.tsx
│   │   ├── Select.tsx
│   │   ├── Card.tsx
│   │   ├── Alert.tsx
│   │   └── Loading.tsx
│   ├── Layout.tsx       # Page layout wrapper
│   ├── ProtectedRoute.tsx
│   ├── AuthenticatedContent.tsx
│   └── UnauthenticatedContent.tsx
├── context/             # React Context providers
│   └── AuthContext.tsx  # Authentication state management
├── routes/              # Route components
│   ├── home.tsx         # Home page (with loader)
│   ├── login.tsx        # Login page (with action)
│   ├── register.tsx     # Register page (with action)
│   └── logout.tsx       # Logout handler
├── services/            # API service layer
│   └── auth.ts          # Authentication API calls
├── types/               # TypeScript types
│   └── auth.ts          # Auth-related types
├── utils/               # Utility functions
│   └── api.ts           # Authenticated fetch helper
├── routes.ts            # Route configuration
└── root.tsx             # Root layout with AuthProvider

## Key Concepts

### 1. Loaders

Loaders run on the server and fetch data before rendering. They enable:
- Server-side rendering
- Automatic revalidation
- Type-safe data fetching

**Example:**
```typescript
// app/routes/home.tsx
export async function loader() {
  const storedUser = getStoredUser();
  const user = storedUser ? JSON.parse(storedUser) : null;
  return { user };
}

export default function Home() {
  const { user } = useLoaderData<typeof loader>();
  // ...
}
```

### 2. Actions

Actions handle form submissions on the server. They enable:
- Progressive enhancement (works without JS)
- Server-side validation
- Automatic loading states

**Example:**
```typescript
// app/routes/login.tsx
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  try {
    const response = await login({ email, password });
    storeToken(response.token);
    return redirect('/');
  } catch (error) {
    return { error: error.message };
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Form method="post">
      {actionData?.error && <Alert>{actionData.error}</Alert>}
      {/* form fields */}
      <Button isLoading={isSubmitting}>Login</Button>
    </Form>
  );
}
```

### 3. Reusable UI Components

All UI components are in `app/components/ui/`:

**Input Component:**
```typescript
<Input
  type="email"
  name="email"
  label="Email"
  placeholder="you@example.com"
  required
/>
```

**Button Component:**
```typescript
<Button type="submit" isLoading={isSubmitting} variant="primary">
  Submit
</Button>
```

**Select Component:**
```typescript
<Select
  name="userType"
  label="Account Type"
  options={[
    { value: 'ADOPTER', label: 'Adopter' },
    { value: 'VENDOR', label: 'Vendor' }
  ]}
/>
```

**Card Component:**
```typescript
<Card>
  <h1>Title</h1>
  <p>Content</p>
</Card>
```

**Alert Component:**
```typescript
<Alert variant="error">Error message</Alert>
<Alert variant="success">Success message</Alert>
```

### 4. Authentication Flow

1. **Login/Register** → Form submission triggers action
2. **Action** → Calls API, stores token, redirects
3. **Loader** → Reads stored user from localStorage
4. **Component** → Renders based on auth state

### 5. Making Authenticated API Calls

Use the `authenticatedFetch` utility:

```typescript
import { authenticatedFetch } from '../utils/api';

// GET request
const response = await authenticatedFetch('/api/pets');
const pets = await response.json();

// POST request
const response = await authenticatedFetch('/api/pets', {
  method: 'POST',
  body: JSON.stringify({ name: 'Fluffy' }),
});
```

**Features:**
- Automatically adds JWT token to headers
- Redirects to login on 401 (expired token)
- Handles JSON content-type

### 6. Protected Routes

Wrap any route that requires authentication:

```typescript
import { ProtectedRoute } from '../components/ProtectedRoute';

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <div>Protected content</div>
    </ProtectedRoute>
  );
}
```

## Component Patterns

### Route Component Pattern

```typescript
import { useLoaderData, useActionData, Form } from 'react-router';
import type { Route } from './+types/my-route';

// Metadata
export function meta({}: Route.MetaArgs) {
  return [{ title: 'Page Title' }];
}

// Server-side data loading
export async function loader({ request }: Route.LoaderArgs) {
  const data = await fetchData();
  return { data };
}

// Server-side form handling
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  // process form data
  return { success: true };
}

// Component
export default function MyRoute() {
  const { data } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();

  return (
    <Layout>
      <Form method="post">
        {/* form fields */}
      </Form>
    </Layout>
  );
}
```

## State Management

### AuthContext

Global authentication state is managed via React Context:

```typescript
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (isAuthenticated) {
    return <div>Welcome {user?.firstName}!</div>;
  }

  return <button onClick={() => login(credentials)}>Login</button>;
}
```

**Available methods:**
- `user: User | null` - Current user object
- `isLoading: boolean` - Auth initialization state
- `isAuthenticated: boolean` - Whether user is logged in
- `login(credentials)` - Login function
- `register(data)` - Register function
- `logout()` - Logout function

## Environment Variables

Create a `.env` file:

```bash
VITE_API_URL=http://localhost:8080
```

This configures the backend API URL.

## TypeScript

All API responses and request bodies are type-safe:

```typescript
import type { User, LoginRequest, RegisterRequest } from '../types/auth';

const loginData: LoginRequest = {
  email: 'user@example.com',
  password: 'password123'
};
```

## Best Practices

1. **Always use Form component** for form submissions (enables progressive enhancement)
2. **Use loaders for data fetching** (enables SSR and automatic revalidation)
3. **Use actions for mutations** (enables progressive enhancement and loading states)
4. **Leverage useNavigation** for loading states
5. **Use reusable UI components** for consistency
6. **Type everything** with TypeScript
7. **Handle errors gracefully** with try/catch and error states

## Development

```bash
# Start dev server
npm run dev

# Type checking
npm run typecheck

# Build for production
npm run build

# Start production server
npm start
```

## Testing the Authentication Flow

1. Visit http://localhost:3001
2. Click "Register" to create an account
3. Fill in all required fields:
   - First Name, Last Name
   - Email (valid format)
   - Password (min 8 characters)
   - Account Type (ADOPTER or VENDOR)
4. Submit the form
5. You'll be redirected to home, logged in
6. Click "Logout" to test logout
7. Click "Login" to test login with existing credentials

## Common Patterns

### Adding a new protected route

1. Create route file: `app/routes/my-route.tsx`
2. Add route to `app/routes.ts`
3. Wrap content in `<ProtectedRoute>`
4. Use `authenticatedFetch` for API calls

### Adding a new form

1. Use `<Form method="post">` (not `<form>`)
2. Export an `action` function
3. Use `useActionData` for error handling
4. Use `useNavigation` for loading states
5. Use reusable UI components (Input, Button, etc.)

### Fetching data

1. Export a `loader` function
2. Use `useLoaderData` in component
3. Data automatically revalidates on navigation

## Architecture Benefits

- ✅ Server-Side Rendering (SSR) for better performance
- ✅ Progressive Enhancement (works without JavaScript)
- ✅ Type Safety throughout the stack
- ✅ Automatic loading states
- ✅ Reusable components
- ✅ Clear separation of concerns
- ✅ Easy to test and maintain
