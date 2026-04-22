import { useLoaderData, Link, useFetcher, redirect } from 'react-router';
import type { Route } from './+types/favorites';
import { useState, useEffect } from 'react';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Heart, Search, X, AlertTriangle, Dog } from 'lucide-react';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { API_BASE_URL, getImageUrl } from '~/config/api-config';
import { PLACEHOLDER_IMAGES } from '~/config/constants';
import type { Pet } from '~/types/pet';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'My Favorites - Petch' },
        { name: 'description', content: 'View your favorited pets' },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getUserFromSession(request);
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');

    if (!user || !token) {
        return redirect('/login');
    }

    let favorites: Pet[] = [];

    try {
        const response = await fetch(`${API_BASE_URL}/api/pets/favorites`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        if (response.ok) {
            favorites = await response.json();
        }
    } catch (error) {
        // Silently handle — empty favorites
    }

    return { user, favorites };
}

export async function action({ request }: Route.ActionArgs) {
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');

    if (!token) {
        return { error: 'Not authenticated' };
    }

    const formData = await request.formData();
    const petId = formData.get('petId') as string;
    const intent = formData.get('intent') as string;

    if (intent === 'unfavorite' && petId) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/pets/${petId}/favorite`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            if (!response.ok) {
                return { error: 'Failed to unfavorite' };
            }
            return { success: true, unfavoritedId: Number(petId) };
        } catch {
            return { error: 'Failed to unfavorite' };
        }
    }

    return { error: 'Invalid action' };
}

function getPetImageUrl(pet: Pet): string {
    if (pet.images && pet.images.length > 0 && pet.images[0].filePath) {
        return getImageUrl(pet.images[0].filePath);
    }
    return PLACEHOLDER_IMAGES[pet.species] || PLACEHOLDER_IMAGES.default;
}

export default function FavoritesPage() {
    const { favorites: initialFavorites } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [favorites, setFavorites] = useState<Pet[]>(initialFavorites);
    const [searchQuery, setSearchQuery] = useState('');

    // Handle server responses: rollback on error, confirm on success
    useEffect(() => {
        if (fetcher.state !== 'idle' || !fetcher.data) return;
        const data = fetcher.data as { success?: boolean; error?: string; unfavoritedId?: number };
        if (data.error) {
            // Rollback: re-add the pet from the initial data
            setFavorites(initialFavorites);
        }
    }, [fetcher.state, fetcher.data, initialFavorites]);

    const handleUnfavorite = (petId: number) => {
        // Optimistic UI
        setFavorites(prev => prev.filter(p => p.id !== petId));
        fetcher.submit(
            { intent: 'unfavorite', petId: String(petId) },
            { method: 'POST' }
        );
    };

    const filteredFavorites = favorites.filter(pet =>
        searchQuery === '' ||
        pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pet.species.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-8 max-w-6xl">
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold flex items-center gap-3">
                            <div className="size-10 rounded-xl bg-rose-500/10 flex items-center justify-center">
                                <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                            </div>
                            My Favorites
                        </h1>
                        <p className="text-muted-foreground mt-1 ml-[52px]">
                            {favorites.length} {favorites.length === 1 ? 'pet' : 'pets'} you've saved
                        </p>
                    </div>
                    <Button asChild variant="outline">
                        <Link to="/pets">Browse More Pets</Link>
                    </Button>
                </div>

                {/* Search Bar */}
                {favorites.length > 0 && (
                    <div className="relative mb-8">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search your favorites by name, breed, or species..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                )}

                {/* Empty State */}
                {favorites.length === 0 ? (
                    <Card className="p-12 text-center border-dashed">
                        <div className="size-16 rounded-xl bg-rose-500/10 flex items-center justify-center mx-auto mb-4">
                            <Heart className="w-8 h-8 text-rose-300" />
                        </div>
                        <p className="text-xl font-semibold mb-2">No favorites yet</p>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Browse the pet listings and tap the heart icon on any pet to save them here!
                        </p>
                        <Button asChild className="bg-coral hover:bg-coral-dark text-white">
                            <Link to="/pets">Explore Pets</Link>
                        </Button>
                    </Card>
                ) : filteredFavorites.length === 0 ? (
                    <div className="text-center py-12">
                        <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                        <p className="text-lg font-medium">No matching pets found</p>
                        <Button variant="link" onClick={() => setSearchQuery('')}>Clear search</Button>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredFavorites.map(pet => (
                            <Card key={pet.id} className="group overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/50 hover:bg-card">
                                {/* Image */}
                                <div className="aspect-[4/3] relative overflow-hidden">
                                    <Link to={`/pets/${pet.id}`}>
                                        <img
                                            src={getPetImageUrl(pet)}
                                            alt={pet.name}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                    </Link>

                                    {/* Unfavorite Button */}
                                    <button
                                        onClick={() => handleUnfavorite(pet.id)}
                                        className="absolute top-3 right-3 z-10 size-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:bg-red-50 hover:scale-110 active:scale-95 transition-all duration-200"
                                        title="Remove from favorites"
                                    >
                                        <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
                                    </button>

                                    {/* At Risk Badge */}
                                    {pet.atRisk && (
                                        <div className="absolute top-3 left-3 z-10 bg-red-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-sm flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Needs Home
                                        </div>
                                    )}
                                </div>

                                {/* Content */}
                                <CardContent className="p-4 space-y-3">
                                    <div>
                                        <h3 className="font-bold text-lg tracking-tight">
                                            <Link to={`/pets/${pet.id}`} className="hover:text-coral transition-colors">
                                                {pet.name}
                                            </Link>
                                        </h3>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            {pet.breed}
                                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                                            {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                                        </p>
                                    </div>

                                    {/* Tags */}
                                    <div className="flex gap-2 flex-wrap">
                                        {pet.species && (
                                            <span className="px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border/50">
                                                {pet.species}
                                            </span>
                                        )}
                                        {pet.fosterable && (
                                            <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-md text-xs font-medium">
                                                Fosterable
                                            </span>
                                        )}
                                        {pet.real && (
                                            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-md text-xs font-medium">
                                                Real
                                            </span>
                                        )}
                                    </div>

                                    {pet.description && (
                                        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                                            {pet.description}
                                        </p>
                                    )}

                                    <div className="pt-2 border-t border-border/40">
                                        <Button
                                            variant="outline"
                                            className="w-full group/btn border-coral/20 text-coral hover:bg-coral hover:text-white hover:border-coral transition-all duration-300"
                                            asChild
                                        >
                                            <Link to={`/pets/${pet.id}`}>
                                                Meet {pet.name} →
                                            </Link>
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
