import { redirect } from 'react-router';
import { getUserFromSession } from '../services/auth';

/**
 * Use this in loaders to protect routes
 * Redirects to /login if user is not authenticated
 *
 * Example:
 * export async function loader({ request }: Route.LoaderArgs) {
 *   const user = await requireUser(request);
 *   // user is guaranteed to be authenticated here
 *   return { user };
 * }
 */
export async function requireUser(request: Request) {
  const user = await getUserFromSession(request);

  if (!user) {
    throw redirect('/login');
  }

  return user;
}
