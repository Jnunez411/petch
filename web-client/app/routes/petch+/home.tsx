import { useLoaderData } from 'react-router';
import type { Route } from './+types/home';
import { getUserFromSession } from '../../services/auth';
import type { User } from '../../types/auth';
import { Layout } from '../../components/Layout';
import { Card } from '../../components/ui/Card';
import { AuthenticatedContent } from '../../components/AuthenticatedContent';
import { UnauthenticatedContent } from '../../components/UnauthenticatedContent';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Petch - Home' },
    { name: 'description', content: 'Welcome to Petch!' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  return { user };
}

export default function Home() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <Layout>
      <div className="max-w-2xl w-full">
        <Card>
          <h1 className="text-3xl font-bold text-center mb-6 text-gray-900 dark:text-white">
            Welcome to Petch
          </h1>

          {user ? (
            <AuthenticatedContent user={user as User} />
          ) : (
            <UnauthenticatedContent />
          )}
        </Card>
      </div>
    </Layout>
  );
}
