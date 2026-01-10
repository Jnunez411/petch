import { useState } from 'react';
import { useLoaderData, useFetcher } from 'react-router';
import type { Route } from './+types/admin.users';
import { getAuthToken } from '~/services/auth';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { API_BASE_URL } from '~/config/api-config';
import type { AdminUser } from '~/types/auth';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'User Management - Admin' },
        { name: 'description', content: 'Manage platform users' },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const token = await getAuthToken(request);

    if (!token) {
        return { users: [], error: 'Not authenticated' };
    }

    try {
        // Fetch with large page size to support client-side filtering
        const response = await fetch(`${API_BASE_URL}/api/admin/users?page=0&size=1000`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return { users: [], error: 'Failed to fetch users' };
        }

        const data = await response.json();
        // Backend returns a Page object, extract content
        const users = data.content || [];
        return { users, error: null };
    } catch (error) {
        return { users: [], error: 'API connection failed' };
    }
}

export async function action({ request }: Route.ActionArgs) {
    const token = await getAuthToken(request);
    const formData = await request.formData();
    const userId = formData.get('userId');
    const actionType = formData.get('_action');

    if (!token || !userId) {
        return { success: false, error: 'Invalid request' };
    }

    if (actionType === 'delete') {
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/users/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                return { success: false, error: 'Failed to delete user' };
            }

            return { success: true };
        } catch {
            return { success: false, error: 'API connection failed' };
        }
    }

    return { success: false, error: 'Unknown action' };
}

const ITEMS_PER_PAGE = 10;

export default function AdminUsers() {
    const { users, error } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [deleteConfirm, setDeleteConfirm] = useState<{ id: number; name: string } | null>(null);

    if (error) {
        return (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive">
                {error}
            </div>
        );
    }

    // Filter users based on search query
    const filteredUsers = users.filter((user: AdminUser) => {
        const query = searchQuery.toLowerCase();
        return (
            user.firstName?.toLowerCase().includes(query) ||
            user.lastName?.toLowerCase().includes(query) ||
            user.email?.toLowerCase().includes(query) ||
            user.userType?.toLowerCase().includes(query)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const adopters = users.filter((u: AdminUser) => u.userType === 'ADOPTER');
    const vendors = users.filter((u: AdminUser) => u.userType === 'VENDOR');
    const admins = users.filter((u: AdminUser) => u.userType === 'ADMIN');

    const handleDeleteClick = (user: AdminUser) => {
        setDeleteConfirm({ id: user.id, name: `${user.firstName} ${user.lastName}` });
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirm) {
            const form = document.createElement('form');
            form.method = 'post';
            const userIdInput = document.createElement('input');
            userIdInput.name = 'userId';
            userIdInput.value = String(deleteConfirm.id);
            const actionInput = document.createElement('input');
            actionInput.name = '_action';
            actionInput.value = 'delete';
            form.appendChild(userIdInput);
            form.appendChild(actionInput);
            fetcher.submit(form);
            setDeleteConfirm(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Delete Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-2">Confirm Delete</h3>
                        <p className="text-muted-foreground mb-4">
                            Are you sure you want to delete <strong>{deleteConfirm.name}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                                Cancel
                            </Button>
                            <Button variant="destructive" onClick={handleDeleteConfirm}>
                                Delete User
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">User Management</h1>
                <p className="text-muted-foreground mt-2">
                    View and manage all registered users on the platform.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{users.length}</p>
                        <p className="text-muted-foreground text-sm">Total Users</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-blue-500">{adopters.length}</p>
                        <p className="text-muted-foreground text-sm">Adopters</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-green-500">{vendors.length}</p>
                        <p className="text-muted-foreground text-sm">Vendors</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-purple-500">{admins.length}</p>
                        <p className="text-muted-foreground text-sm">Admins</p>
                    </CardContent>
                </Card>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader className="border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h2 className="text-lg font-semibold">All Users</h2>
                        <input
                            type="text"
                            placeholder="Search by name, email, or type..."
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value);
                                setCurrentPage(1);
                            }}
                            className="px-4 py-2 border rounded-lg bg-background text-foreground w-full sm:w-80 focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left py-3 px-4 font-medium">ID</th>
                                    <th className="text-left py-3 px-4 font-medium">User</th>
                                    <th className="text-left py-3 px-4 font-medium">Type</th>
                                    <th className="text-left py-3 px-4 font-medium">Joined</th>
                                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedUsers.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                                            {searchQuery ? `No users found matching "${searchQuery}"` : 'No users found'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedUsers.map((user: AdminUser) => (
                                        <tr key={user.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 text-muted-foreground">#{user.id}</td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{user.firstName} {user.lastName}</p>
                                                    <p className="text-muted-foreground text-xs">{user.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span
                                                    className={`px-2 py-1 rounded text-xs font-medium ${user.userType === 'ADMIN'
                                                        ? 'bg-purple-100 text-purple-700'
                                                        : user.userType === 'VENDOR'
                                                            ? 'bg-green-100 text-green-700'
                                                            : 'bg-blue-100 text-blue-700'
                                                        }`}
                                                >
                                                    {user.userType}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground">
                                                {new Date(user.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="py-3 px-4">
                                                {user.userType !== 'ADMIN' ? (
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(user)}
                                                        disabled={fetcher.state !== 'idle'}
                                                    >
                                                        {fetcher.state !== 'idle' ? 'Deleting...' : 'Delete'}
                                                    </Button>
                                                ) : (
                                                    <span className="text-muted-foreground text-xs">Protected</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-4 py-3 border-t">
                            <p className="text-sm text-muted-foreground">
                                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length}
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                >
                                    Previous
                                </Button>
                                <span className="flex items-center px-3 text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
