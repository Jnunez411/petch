import { redirect } from 'react-router';
import type { Route } from './+types/profile';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  // Redirect to login if not authenticated
  if (!user || !token) {
    return redirect('/login?redirectTo=/profile');
  }

  // Redirect based on user type
  if (user.userType === 'ADOPTER') {
    return redirect('/profile/adopter');
  }

  if (user.userType === 'VENDOR') {
    return redirect('/profile/vendor');
  }

  // Fallback for unknown user types
  return redirect('/pets');
}
