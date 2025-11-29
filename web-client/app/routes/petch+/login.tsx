import { Form, Link, redirect, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/login';
import { login, createUserSession, getUserFromSession } from '../../services/auth';
import { Layout } from '../../components/Layout';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Alert } from '../../components/ui/Alert';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Login - Petch' },
    { name: 'description', content: 'Login to your Petch account' },
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

  try {
    const response = await login({ email, password });
    return await createUserSession(request, response, '/');
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Login failed. Please try again.',
    };
  }
}

export default function Login() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Layout>
      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Login to Petch
          </h1>

          {actionData?.error && (
            <Alert variant="error" className="mb-4">
              {actionData.error}
            </Alert>
          )}

          <Form method="post" className="space-y-4">
            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Enter your password"
              required
              autoComplete="current-password"
            />

            <Button type="submit" isLoading={isSubmitting}>
              Login
            </Button>
          </Form>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Register here
            </Link>
          </p>
        </Card>
      </div>
    </Layout>
  );
}
