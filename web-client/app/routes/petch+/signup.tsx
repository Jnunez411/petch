import { redirect, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/signup';
import { register, createUserSession, getUserFromSession } from '~/services/auth';
import type { UserType } from '~/types/auth';
import { SignupForm } from '~/components/blocks';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Sign Up - Petch' },
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
    return { error: 'Password must be at least 8 characters long' };
  }

  if (!email || !firstName || !lastName || !userType) {
    return { error: 'Please fill in all required fields' };
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

export default function Signup() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <SignupForm 
      error={actionData?.error}
      isSubmitting={isSubmitting}
    />
  );
}
