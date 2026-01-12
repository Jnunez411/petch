import { redirect, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/login';
import { login, createUserSession, getUserFromSession } from '~/services/auth';
import { LoginForm } from '~/components/blocks';
import { routeLogger } from '~/utils/logger';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Login - Petch' },
    { name: 'description', content: 'Sign in to your Petch account' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  if (user) {
    routeLogger.info('Already authenticated user redirected from login', { email: user.email });
    return redirect('/');
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    routeLogger.warn('Login attempt with missing credentials');
    return { error: 'Please enter your email and password' };
  }

  try {
    routeLogger.info('Processing login', { email });
    const response = await login({ email, password });
    return await createUserSession(request, response, '/');
  } catch (error) {
    routeLogger.error('Login action failed', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return {
      error: error instanceof Error ? error.message : 'Login failed. Please check your credentials.',
    };
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <LoginForm
      error={actionData?.error}
      isSubmitting={isSubmitting}
    />
  );
}
