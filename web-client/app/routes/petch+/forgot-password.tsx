import { redirect, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/forgot-password';
import { forgotPassword, getUserFromSession } from '~/services/auth';
import { ForgotPasswordForm } from '~/components/blocks/ForgotPasswordForm';
import { routeLogger } from '~/utils/logger';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Forgot Password - Petch' },
    { name: 'description', content: 'Reset your Petch account password' },
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

  if (!email) {
    return { error: 'Please enter your email address' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { error: 'Please enter a valid email address' };
  }

  try {
    routeLogger.info('Processing forgot password', { email });
    await forgotPassword(email);
    return { success: true };
  } catch (error) {
    routeLogger.error('Forgot password failed', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return {
      error: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
    };
  }
}

export default function ForgotPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  return (
    <ForgotPasswordForm
      error={actionData?.error}
      success={actionData?.success}
      isSubmitting={isSubmitting}
    />
  );
}
