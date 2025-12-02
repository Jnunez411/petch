import { redirect, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/login';
import { login, createUserSession, getUserFromSession } from '~/services/auth';
import { LoginForm } from '~/components/blocks';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Login - Petch' },
    { name: 'description', content: 'Sign in to your Petch account' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  if (user) {
    return redirect('/');
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { error: 'Please enter your email and password' };
  }

  try {
    const response = await login({ email, password });
    return await createUserSession(request, response, '/');
  } catch (error) {
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
