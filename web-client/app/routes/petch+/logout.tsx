import { redirect } from 'react-router';
import type { Route } from './+types/logout';
import { logout } from '../../services/auth';

export async function action({ request }: Route.ActionArgs) {
  return await logout(request);
}

export async function loader({ request }: Route.LoaderArgs) {
  return await logout(request);
}
