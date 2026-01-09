import { useState } from 'react';
import { useLoaderData, useFetcher, Link } from 'react-router';
import type { Route } from './+types/admin.pets';
import { getAuthToken } from '~/services/auth';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

const API_BASE = 'http://localhost:8080';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Pet Management - Admin' },
        { name: 'description', content: 'Manage pet listings' },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const token = await getAuthToken(request);

    if (!token) {
        return { pets: [], error: 'Not authenticated' };
    }

    try {
        const response = await fetch(`${API_BASE}/api/admin/pets`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return { pets: [], error: 'Failed to fetch pets' };
        }

        const pets = await response.json();
        return { pets, error: null };
    } catch (error) {
        return { pets: [], error: 'API connection failed' };
    }
}

export async function action({ request }: Route.ActionArgs) {
    const token = await getAuthToken(request);
    const formData = await request.formData();
    const petId = formData.get('petId');
    const actionType = formData.get('_action');

    if (!token || !petId) {
        return { success: false, error: 'Invalid request' };
    }

    if (actionType === 'delete') {
        try {
            const response = await fetch(`${API_BASE}/api/admin/pets/${petId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                return { success: false, error: 'Failed to delete pet' };
            }

            return { success: true };
        } catch {
            return { success: false, error: 'API connection failed' };
        }
    }

    return { success: false, error: 'Unknown action' };
}

const ITEMS_PER_PAGE = 10;

export default function AdminPets() {
    const { pets, error } = useLoaderData<typeof loader>();
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

    // Filter pets based on search query
    const filteredPets = pets.filter((pet: any) => {
        const query = searchQuery.toLowerCase();
        return (
            pet.name?.toLowerCase().includes(query) ||
            pet.species?.toLowerCase().includes(query) ||
            pet.breed?.toLowerCase().includes(query)
        );
    });

    // Pagination
    const totalPages = Math.ceil(filteredPets.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedPets = filteredPets.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const speciesCounts = pets.reduce((acc: any, pet: any) => {
        acc[pet.species] = (acc[pet.species] || 0) + 1;
        return acc;
    }, {});

    const handleDeleteClick = (pet: any) => {
        setDeleteConfirm({ id: pet.id, name: `${pet.name} (${pet.species})` });
    };

    const handleDeleteConfirm = () => {
        if (deleteConfirm) {
            const form = document.createElement('form');
            form.method = 'post';
            const petIdInput = document.createElement('input');
            petIdInput.name = 'petId';
            petIdInput.value = String(deleteConfirm.id);
            const actionInput = document.createElement('input');
            actionInput.name = '_action';
            actionInput.value = 'delete';
            form.appendChild(petIdInput);
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
                                Delete Pet
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Pet Listings</h1>
                <p className="text-muted-foreground mt-2">
                    Review and manage all pet listings on the platform.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold">{pets.length}</p>
                        <p className="text-muted-foreground text-sm">Total Pets</p>
                    </CardContent>
                </Card>
                {Object.entries(speciesCounts).slice(0, 5).map(([species, count]) => (
                    <Card key={species}>
                        <CardContent className="pt-6 text-center">
                            <p className="text-3xl font-bold text-primary">{count as number}</p>
                            <p className="text-muted-foreground text-sm">{species}s</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Pets Table */}
            <Card>
                <CardHeader className="border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h2 className="text-lg font-semibold">All Pet Listings</h2>
                        <input
                            type="text"
                            placeholder="Search by name, species, or breed..."
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
                                    <th className="text-left py-3 px-4 font-medium">Name</th>
                                    <th className="text-left py-3 px-4 font-medium">Species</th>
                                    <th className="text-left py-3 px-4 font-medium">Breed</th>
                                    <th className="text-left py-3 px-4 font-medium">Age</th>
                                    <th className="text-left py-3 px-4 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedPets.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                            {searchQuery ? `No pets found matching "${searchQuery}"` : 'No pets found'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedPets.map((pet: any) => (
                                        <tr key={pet.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 text-muted-foreground">#{pet.id}</td>
                                            <td className="py-3 px-4 font-medium">{pet.name}</td>
                                            <td className="py-3 px-4">{pet.species}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{pet.breed}</td>
                                            <td className="py-3 px-4 text-muted-foreground">{pet.age} yrs</td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {pet.atRisk && (
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-700">
                                                            At Risk
                                                        </span>
                                                    )}
                                                    {pet.fosterable && (
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-700">
                                                            Fosterable
                                                        </span>
                                                    )}
                                                    {!pet.atRisk && !pet.fosterable && (
                                                        <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-700">
                                                            Available
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <Button variant="outline" size="sm" asChild>
                                                        <Link to={`/pets/${pet.id}`} target="_blank">
                                                            View
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="destructive"
                                                        size="sm"
                                                        onClick={() => handleDeleteClick(pet)}
                                                        disabled={fetcher.state !== 'idle'}
                                                    >
                                                        {fetcher.state !== 'idle' ? '...' : 'Delete'}
                                                    </Button>
                                                </div>
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
                                Showing {startIndex + 1}-{Math.min(startIndex + ITEMS_PER_PAGE, filteredPets.length)} of {filteredPets.length}
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
