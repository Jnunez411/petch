import { redirect, useActionData, useNavigation, useSearchParams } from 'react-router';
import type { Route } from './+types/reset-password';
import { resetPassword, getUserFromSession } from '~/services/auth';
import { ResetPasswordForm } from '~/components/blocks/ResetPasswordForm';
import { routeLogger } from '~/utils/logger';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Reset Password - Petch' },
    { name: 'description', content: 'Set a new password for your Petch account' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  if (user) {
    return redirect('/');
  }

  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  if (!token) {
    return redirect('/forgot-password');
  }

  return { token };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const token = formData.get('token') as string;
  const newPassword = formData.get('newPassword') as string;

  if (!token || !newPassword) {
    return { error: 'Missing required fields' };
  }

  try {
    routeLogger.info('Processing password reset');
    await resetPassword(token, newPassword);
    return { success: true };
  } catch (error) {
    routeLogger.error('Password reset failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return {
      error: error instanceof Error ? error.message : 'Failed to reset password. Please try again.',
    };
  }
}

export default function ResetPassword() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  return (
    <ResetPasswordForm
      token={token}
      error={actionData?.error}
      success={actionData?.success}
      isSubmitting={isSubmitting}
    />
  );
}
