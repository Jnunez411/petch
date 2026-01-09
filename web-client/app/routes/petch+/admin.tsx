import { Outlet, useLoaderData, Link, redirect, Form } from 'react-router';
import type { Route } from './+types/admin';
import { getUserFromSession } from '~/services/auth';
import { Button } from '~/components/ui/button';
import { PawIcon } from '~/components/ui/paw-icon';

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getUserFromSession(request);

    // Security: Only allow ADMIN users
    if (!user || user.userType !== 'ADMIN') {
        throw redirect('/');
    }

    return { user };
}

export default function AdminLayout() {
    const { user } = useLoaderData<typeof loader>();

    return (
        <div className="min-h-screen bg-background">
            {/* Admin Header */}
            <header className="sticky top-0 z-50 w-full border-b bg-card/80 backdrop-blur-md">
                <div className="container mx-auto flex h-16 items-center justify-between px-4">
                    <div className="flex items-center gap-8">
                        <Link to="/admin" className="flex items-center gap-2">
                            <PawIcon className="h-8 w-8" />
                            <span className="text-xl font-bold text-primary">Admin Dashboard</span>
                        </Link>
                        <nav className="hidden md:flex items-center gap-6">
                            <Link to="/admin" className="text-foreground hover:text-primary transition-colors">
                                Overview
                            </Link>
                            <Link to="/admin/users" className="text-foreground hover:text-primary transition-colors">
                                Users
                            </Link>
                            <Link to="/admin/pets" className="text-foreground hover:text-primary transition-colors">
                                Pets
                            </Link>
                            <Link to="/admin/listings" className="text-foreground hover:text-primary transition-colors">
                                Pet Listings
                            </Link>
                        </nav>
                    </div>
                    <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">
                            {user.firstName} {user.lastName} ({user.email})
                        </span>
                        <Form method="post" action="/logout">
                            <Button variant="outline" size="sm" type="submit" className="bg-primary text-primary-foreground">
                                Logout
                            </Button>
                        </Form>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-8">
                <Outlet />
            </main>
        </div>
    );
}

