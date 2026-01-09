import { useLoaderData, Link } from 'react-router';
import type { Route } from './+types/admin._index';
import { getUserFromSession, getAuthToken } from '~/services/auth';
import { Card, CardContent, CardHeader } from '~/components/ui/card';

const API_BASE = 'http://localhost:8080';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Admin Dashboard - Petch' },
        { name: 'description', content: 'Petch Administration Panel' },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getUserFromSession(request);
    const token = await getAuthToken(request);

    if (!token) {
        return { user: null, stats: null, error: 'Not authenticated' };
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/stats`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return { user, stats: null, error: 'Failed to fetch stats' };
        }

        const stats = await response.json();
        return { user, stats, error: null };
    } catch (error) {
        return { user, stats: null, error: 'API connection failed' };
    }
}

export default function AdminDashboard() {
    const { user, stats, error } = useLoaderData<typeof loader>();

    const currentHour = new Date().getHours();
    const greeting = currentHour < 12 ? 'Good morning' : currentHour < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="bg-primary/10 border border-primary/20 rounded-2xl p-8">
                <h1 className="text-3xl font-bold text-foreground mb-2">
                    {greeting}, {user?.firstName || 'Admin'}!
                </h1>
                <p className="text-muted-foreground text-lg">
                    Welcome to the Petch Admin Dashboard. Monitor platform activity, manage users, and oversee pet listings.
                </p>
            </div>

            {/* Error State */}
            {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive">
                    {error}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="pb-2">
                        <span className="text-sm text-muted-foreground">Total Users</span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{stats?.totalUsers ?? 0}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <span className="text-sm text-muted-foreground">Total Pets</span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold">{stats?.totalPets ?? 0}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <span className="text-sm text-muted-foreground">Adopters</span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-blue-500">{stats?.totalAdopters ?? 0}</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <span className="text-sm text-muted-foreground">Vendors</span>
                    </CardHeader>
                    <CardContent>
                        <p className="text-4xl font-bold text-green-500">{stats?.totalVendors ?? 0}</p>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link to="/admin/users">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">User Management</h3>
                            <p className="text-muted-foreground text-sm">Manage all registered users</p>
                        </CardHeader>
                        <CardContent className="text-muted-foreground">
                            View, search, and manage all registered users. Remove spam accounts or problematic users from the platform.
                        </CardContent>
                    </Card>
                </Link>

                <Link to="/admin/pets">
                    <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                        <CardHeader>
                            <h3 className="text-lg font-semibold">Pet Listings</h3>
                            <p className="text-muted-foreground text-sm">Review and moderate listings</p>
                        </CardHeader>
                        <CardContent className="text-muted-foreground">
                            Review and moderate pet listings. Remove inappropriate or fake listings to maintain platform quality.
                        </CardContent>
                    </Card>
                </Link>
            </div>

            {/* Platform Status */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></span>
                        System Status
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-muted/50">
                            <p className="text-green-600 font-semibold">Online</p>
                            <p className="text-muted-foreground text-sm">API Server</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50">
                            <p className="text-green-600 font-semibold">Connected</p>
                            <p className="text-muted-foreground text-sm">Database</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50">
                            <p className="text-green-600 font-semibold">Active</p>
                            <p className="text-muted-foreground text-sm">Auth Service</p>
                        </div>
                        <div className="p-4 rounded-xl bg-muted/50">
                            <p className="text-green-600 font-semibold">Running</p>
                            <p className="text-muted-foreground text-sm">Web Client</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
