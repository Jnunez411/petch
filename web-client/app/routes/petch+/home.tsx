import { useLoaderData, Link, Form } from 'react-router';
import type { Route } from './+types/home';
import { getUserFromSession } from '~/services/auth';
import type { User } from '~/types/auth';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Petch - Find Your Perfect Pet' },
    { name: 'description', content: 'Connect with loving pets waiting for their forever home' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  return { user };
}

export default function Home() {
  const { user } = useLoaderData<typeof loader>();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-24 text-center ">
        <div className="max-w-3xl mx-auto space-y-6">
          <h1 className="text-5xl font-bold tracking-tight">
            Find Your Perfect
            <span className="text-primary"> Furry Friend</span>
          </h1>
          <p className="text-xl text-muted-foreground">
            Connect with loving pets from trusted breeders and shelters. 
            Your new best friend is waiting for you.
          </p>
          <div className="flex gap-4 justify-center pt-4">
            {user ? (
              <>
                <Button size="lg"  asChild>
                  <Link to="/pets">Browse Pets</Link>
                </Button>
                <Button className="bg-secondary text-transition"size="lg" variant="outline" asChild>
                  <Link to="/profile">My Profile</Link>
                </Button>
              </>
            ) : (
              <>
                <Button size="lg" asChild>
                  <Link to="/signup">Get Started</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/login">I have an account</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader className="text-center">
              <span className="text-4xl mb-4 block">🐕</span>
              <h3 className="text-lg font-semibold">For Adopters</h3>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              Browse thousands of pets from verified breeders and shelters. 
              Find your perfect match with our smart filters.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <span className="text-4xl mb-4 block">🏠</span>
              <h3 className="text-lg font-semibold">For Shelters</h3>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              List your animals and connect with loving families. 
              Track adoptions and manage your listings easily.
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="text-center">
              <span className="text-4xl mb-4 block">💝</span>
              <h3 className="text-lg font-semibold">Safe & Trusted</h3>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              All vendors are verified. Secure messaging and 
              transparent adoption process for peace of mind.
            </CardContent>
          </Card>
        </div>
      </section>

      {/* User Info Section (if logged in) */}
      {user && (
        <section className="container mx-auto px-4 py-16">
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <h3 className="text-lg font-semibold">Your Account</h3>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><strong>Name:</strong> {user.firstName} {user.lastName}</p>
              <p><strong>Email:</strong> {user.email}</p>
              <p><strong>Account Type:</strong> {user.userType}</p>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t mt-16">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p>© 2025 Petch. Made with 💕 for pets everywhere.</p>
        </div>
      </footer>
    </div>
  );
}
