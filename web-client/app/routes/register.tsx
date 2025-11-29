import { Form, Link, redirect, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/register';
import { register, createUserSession, getUserFromSession } from '../services/auth';
import type { UserType } from '../types/auth';
import { Layout } from '../components/Layout';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Card } from '../components/ui/Card';
import { Alert } from '../components/ui/Alert';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Register - Petch' },
    { name: 'description', content: 'Create your Petch account' },
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
  const firstName = formData.get('firstName') as string;
  const lastName = formData.get('lastName') as string;
  const phoneNumber = formData.get('phoneNumber') as string;
  const userType = formData.get('userType') as UserType;

  if (password.length < 8) {
    return {
      error: 'Password must be at least 8 characters long',
    };
  }

  try {
    const response = await register({
      email,
      password,
      firstName,
      lastName,
      phoneNumber: phoneNumber || undefined,
      userType,
    });

    return await createUserSession(request, response, '/');
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Registration failed. Please try again.',
    };
  }
}

const userTypeOptions = [
  { value: 'ADOPTER', label: 'Adopter (Looking to adopt pets)' },
  { value: 'VENDOR', label: 'Vendor (Breeder/Shelter)' },
];

export default function Register() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <Layout>
      <div className="w-full max-w-md">
        <Card>
          <h1 className="text-2xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Create Account
          </h1>

          {actionData?.error && (
            <Alert variant="error" className="mb-4">
              {actionData.error}
            </Alert>
          )}

          <Form method="post" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                type="text"
                name="firstName"
                label="First Name"
                required
                autoComplete="given-name"
              />

              <Input
                type="text"
                name="lastName"
                label="Last Name"
                required
                autoComplete="family-name"
              />
            </div>

            <Input
              type="email"
              name="email"
              label="Email"
              placeholder="you@example.com"
              required
              autoComplete="email"
            />

            <Input
              type="tel"
              name="phoneNumber"
              label="Phone Number (Optional)"
              placeholder="+1 (555) 000-0000"
              autoComplete="tel"
            />

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Minimum 8 characters"
              required
              minLength={8}
              autoComplete="new-password"
            />

            <Select
              name="userType"
              label="Account Type"
              options={userTypeOptions}
              defaultValue="ADOPTER"
              required
            />

            <Button type="submit" isLoading={isSubmitting}>
              Create Account
            </Button>
          </Form>

          <p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
            >
              Login here
            </Link>
          </p>
        </Card>
      </div>
    </Layout>
  );
}
