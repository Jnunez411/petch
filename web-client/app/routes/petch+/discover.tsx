import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/discover';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Card, CardContent } from '~/components/ui/card';
import { Heart, X, Undo2, Eye, Sparkles, RotateCcw, AlertTriangle, Home as HomeIcon, Search } from 'lucide-react';
import { getUserFromSession, getSession } from '~/services/auth';
import {
    discoverPets,
    recordInteraction,
    fetchLikedPets,
    type UserPreferences,
    undoInteraction
} from '~/services/pet-match-algorithm';
import { API_BASE_URL, getImageUrl } from '~/config/api-config';
import { PLACEHOLDER_IMAGES, SWIPE_ANIMATION_DURATION } from '~/config/constants';
import type { Pet, SwipeHistory } from '~/types/pet';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Discover Pets - Petch' },
        { name: 'description', content: 'Swipe to find your perfect pet match' },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const user = await getUserFromSession(request);
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');

    if (!user || !token) {
        return redirect('/login');
    }
    return { user, token };
}

export default function DiscoverPage() {
    const { user, token } = useLoaderData<typeof loader>();
    const [preferences, setPreferences] = useState<UserPreferences>({ likedPetIds: [], passedPetIds: [], totalSwipes: 0 });
    const [petQueue, setPetQueue] = useState<Pet[]>([]);
    const [likedPetsList, setLikedPetsList] = useState<Pet[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'undo-start' | 'undo-end' | 'instant-left' | 'instant-right' | 'undo-from-left' | 'undo-from-right' | 'undo-enter' | null>(null);
    const [showFavorites, setShowFavorites] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [isAnimating, setIsAnimating] = useState(false);
    const [isResetting, setIsResetting] = useState(false);
    const [history, setHistory] = useState<SwipeHistory[]>([]);

    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const load = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            // Load both discover pets and liked pets in parallel
            const [pets, likedPets] = await Promise.all([
                discoverPets(token),
                fetchLikedPets(token)
            ]);
            setPetQueue(pets);
            setLikedPetsList(likedPets);
            // Update preferences with liked pet IDs from backend
            setPreferences(prev => ({
                ...prev,
                likedPetIds: likedPets.map((p) => p.id)
            }));
        } catch (error) {
            console.error('Failed to load pets:', error);
            setError('Failed to connect to the server. Please check your connection and try again.');
        } finally {
            setIsLoading(false);
        }
    }, [token]);

    // Initial load from API
    useEffect(() => {
        load();
    }, [load]);

    const currentPet = petQueue[currentIndex];
    const hasMorePets = currentIndex < petQueue.length;
    const canUndo = history.length > 0 && !isAnimating;

    // Helper to get image URL from pet (Backend format)
    const getPetImageUrl = (pet: Pet) => {
        if (pet.images && pet.images.length > 0) {
            const imageUrl = getImageUrl(pet.images[0].filePath);
            if (imageUrl) return imageUrl;
        }
        return PLACEHOLDER_IMAGES[pet.species] || PLACEHOLDER_IMAGES.default;
    };

    // Helper to get adoption fee
    const getPetAdoptionFee = (pet: Pet) => {
        return pet.adoptionDetails?.priceEstimate || 0;
    };

    // Handle like action
    const handleLike = useCallback(async () => {
        if (!currentPet || isAnimating) return;

        setIsAnimating(true);
        setSwipeDirection('right');

        try {
            await recordInteraction(currentPet.id, 'LIKE', token);
            // PERFORMANCE: Limit history to last 20 swipes to prevent memory growth
            setHistory(prev => [...prev.slice(-19), { pet: currentPet, direction: 'right' }]);
            setPreferences(prev => ({
                ...prev,
                likedPetIds: [...prev.likedPetIds, currentPet.id],
                totalSwipes: prev.totalSwipes + 1
            }));

            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setSwipeDirection(null);
                setIsAnimating(false);
            }, SWIPE_ANIMATION_DURATION);
        } catch (error) {
            console.error('Failed to record like:', error);
            setSwipeDirection(null);
            setIsAnimating(false);
        }
    }, [currentPet, token, isAnimating]);

    // Handle pass action
    const handlePass = useCallback(async () => {
        if (!currentPet || isAnimating) return;

        setIsAnimating(true);
        setSwipeDirection('left');

        try {
            await recordInteraction(currentPet.id, 'PASS', token);
            // PERFORMANCE: Limit history to last 20 swipes to prevent memory growth
            setHistory(prev => [...prev.slice(-19), { pet: currentPet, direction: 'left' }]);
            setPreferences(prev => ({
                ...prev,
                passedPetIds: [...prev.passedPetIds, currentPet.id],
                totalSwipes: prev.totalSwipes + 1
            }));

            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
                setSwipeDirection(null);
                setIsAnimating(false);
            }, SWIPE_ANIMATION_DURATION);
        } catch (error) {
            console.error('Failed to record pass:', error);
            setSwipeDirection(null);
            setIsAnimating(false);
        }
    }, [currentPet, token, isAnimating]);

    // Discovery reset: clearing interactions in the backend and refreshing state
    const handleReset = async () => {
        setIsResetting(true);
        try {
            const response = await fetch(`${API_BASE_URL}/api/pets/discover/reset`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (response.ok) {
                // Refetch data instead of reloading the page
                const [pets, likedPets] = await Promise.all([
                    discoverPets(token),
                    fetchLikedPets(token)
                ]);
                setPetQueue(pets);
                setLikedPetsList(likedPets);
                setCurrentIndex(0);
                setHistory([]);
                setPreferences({
                    likedPetIds: likedPets.map((p) => p.id),
                    passedPetIds: [],
                    totalSwipes: 0
                });
            } else {
                console.error('Failed to reset discovery:', await response.text());
            }
        } catch (error) {
            console.error('Error resetting discovery:', error);
        } finally {
            setIsResetting(false);
        }
    };



    // Undo action
    const handleUndo = useCallback(async () => {
        if (history.length === 0 || isAnimating) return;

        const lastInteraction = history[history.length - 1];
        setIsAnimating(true);

        try {
            // Call backend to remove interaction
            await undoInteraction(lastInteraction.pet.id, token);

            // Update UI state
            setHistory(prev => prev.slice(0, -1));

            // Remove from liked pets if it was there
            setPreferences(prev => ({
                ...prev,
                likedPetIds: prev.likedPetIds.filter(id => id !== lastInteraction.pet.id),
                passedPetIds: prev.passedPetIds.filter(id => id !== lastInteraction.pet.id),
                totalSwipes: Math.max(0, prev.totalSwipes - 1)
            }));

            // Seamless undo animation sequence:
            // 1. Position card off-screen instantly (no transition)
            const dir = lastInteraction.direction || 'left';
            setSwipeDirection(`undo-from-${dir}` as 'undo-from-left' | 'undo-from-right');
            setCurrentIndex(prev => Math.max(0, prev - 1));

            // 2. After a single frame, trigger the slide-in animation
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setSwipeDirection('undo-enter');

                    // 3. Clean up after animation completes (400ms for bounce effect)
                    setTimeout(() => {
                        setSwipeDirection(null);
                        setIsAnimating(false);
                    }, 400);
                });
            });

        } catch (error) {
            console.error('Failed to undo:', error);
            setIsAnimating(false);
        }
    }, [history, token, isAnimating]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showFavorites) return;

            switch (e.key) {
                case 'ArrowRight':
                    e.preventDefault();
                    handleLike();
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    handlePass();
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleUndo();
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleLike, handlePass, handleUndo, showFavorites]);

    // Handle unfavoriting a pet from the favorites view
    const handleUnfavorite = useCallback(async (petId: number) => {
        try {
            await undoInteraction(petId, token);
            // Update local state
            setLikedPetsList(prev => prev.filter(p => p.id !== petId));
            setPreferences(prev => ({
                ...prev,
                likedPetIds: prev.likedPetIds.filter(id => id !== petId),
            }));
        } catch (error) {
            console.error('Failed to unfavorite pet:', error);
        }
    }, [token]);

    // PERFORMANCE: Memoize liked pets computation to avoid recalculating on every render
    // NOTE: This must be before any early returns to satisfy React's rules of hooks
    const allLikedPets = useMemo(() => [
        ...likedPetsList,
        ...petQueue.filter(p => preferences.likedPetIds.includes(p.id) && !likedPetsList.find((lp: Pet) => lp.id === p.id))
    ], [likedPetsList, petQueue, preferences.likedPetIds]);

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
                <AlertTriangle className="w-12 h-12 text-destructive mb-4" />
                <h3 className="text-xl font-semibold mb-2">Connection Error</h3>
                <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
                <Button onClick={load} variant="default" className="gap-2">
                    <RotateCcw className="w-4 h-4" />
                    Try Again
                </Button>
            </div>
        );
    }

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="animate-pulse text-muted-foreground flex flex-col items-center gap-4">
                    <Sparkles className="w-12 h-12 text-coral" />
                    <span>Fetching your matches...</span>
                </div>
            </div>
        );
    }

    // Favorites view
    if (showFavorites) {
        // Filter favorites based on search query
        const filteredFavorites = allLikedPets.filter(pet =>
            searchQuery === '' ||
            pet.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pet.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
            pet.species.toLowerCase().includes(searchQuery.toLowerCase())
        );

        return (
            <div className="min-h-screen bg-background">
                <div className="container mx-auto px-4 py-8 max-w-4xl">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold flex items-center gap-2">
                                <Heart className="w-8 h-8 text-rose-500 fill-rose-500" />
                                Your Favorites
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                {allLikedPets.length} {allLikedPets.length === 1 ? 'pet' : 'pets'} you've liked
                            </p>
                        </div>
                        <Button variant="outline" onClick={() => setShowFavorites(false)}>
                            ← Back to Discover
                        </Button>
                    </div>

                    {/* Search Bar */}
                    <div className="relative mb-8">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, breed, or species..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {allLikedPets.length === 0 ? (
                        <Card className="p-12 text-center">
                            <Heart className="w-16 h-16 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-xl font-medium mb-2">No favorites yet</p>
                            <p className="text-muted-foreground mb-6">
                                Start swiping to find pets you love!
                            </p>
                            <Button onClick={() => setShowFavorites(false)}>
                                Start Discovering
                            </Button>
                        </Card>
                    ) : filteredFavorites.length === 0 ? (
                        <div className="text-center py-12">
                            <Search className="w-12 h-12 mx-auto text-muted-foreground/30 mb-4" />
                            <p className="text-lg font-medium">No matching pets found</p>
                            <Button variant="link" onClick={() => setSearchQuery('')}>Clear search</Button>
                        </div>
                    ) : (
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredFavorites.map(pet => (
                                <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                                    <div className="aspect-[4/3] relative">
                                        <img
                                            src={getPetImageUrl(pet)}
                                            alt={pet.name}
                                            className="w-full h-full object-cover"
                                        />
                                        {/* Unfavorite button */}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleUnfavorite(pet.id)}
                                            className="absolute top-2 right-2 h-8 w-8 rounded-full bg-black/50 hover:bg-red-500 text-white transition-colors"
                                            title="Remove from favorites"
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                        {pet.atRisk && (
                                            <div className="absolute top-2 left-2 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                                                <AlertTriangle className="w-3 h-3" />
                                                Needs Home
                                            </div>
                                        )}
                                    </div>
                                    <CardContent className="p-4">
                                        <h3 className="font-bold text-lg">{pet.name}</h3>
                                        <p className="text-sm text-muted-foreground">
                                            {pet.breed} • {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                                        </p>
                                        <Button asChild className="w-full mt-3" size="sm">
                                            <Link to={`/pets/${pet.id}`}>View Details</Link>
                                        </Button>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        );
    }



    // Empty state - no more pets
    if (!hasMorePets) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <Sparkles className="w-16 h-16 mx-auto text-coral mb-4" />
                    <h2 className="text-2xl font-bold mb-2">You've Seen Everyone!</h2>
                    <p className="text-muted-foreground mb-6">
                        You've swiped through all available matches.
                        {preferences.likedPetIds.length > 0 && ` You liked ${preferences.likedPetIds.length} of them!`}
                    </p>

                    <div className="space-y-3">
                        <Button
                            onClick={() => setShowFavorites(true)}
                            className="w-full"
                            disabled={preferences.likedPetIds.length === 0}
                        >
                            <Heart className="w-4 h-4 mr-2" />
                            View {preferences.likedPetIds.length} Favorites
                        </Button>
                        <Button variant="outline" onClick={handleReset} className="w-full">
                            <RotateCcw className="w-4 h-4 mr-2" />
                            Start Over
                        </Button>
                        <Button variant="ghost" asChild className="w-full">
                            <Link to="/pets">
                                <Eye className="w-4 h-4 mr-2" />
                                Browse All Pets
                            </Link>
                        </Button>
                    </div>
                </Card>
            </div>
        );
    }

    // Main swipe UI
    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Header */}
            <div className="container mx-auto px-4 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" asChild>
                            <Link to="/">
                                <HomeIcon className="w-4 h-4 mr-1" />
                                Home
                            </Link>
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowFavorites(true)}
                            className="flex items-center gap-1"
                        >
                            <Heart className="w-4 h-4" />
                            <span>{preferences.likedPetIds.length}</span>
                        </Button>
                    </div>
                </div>
            </div>



            {/* Card Stack */}
            <div className="container mx-auto px-4 flex justify-center">
                <div className="relative w-full max-w-md aspect-[3/4]">
                    {/* Current card */}
                    <Card
                        className={`absolute inset-0 overflow-hidden shadow-xl
                            ${swipeDirection?.startsWith('undo-from') ? 'duration-0' : ''}
                            ${swipeDirection === 'undo-enter' ? 'duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)] scale-100 translate-x-0 rotate-0 opacity-100' : ''}
                            ${!swipeDirection?.startsWith('undo') ? 'transition-all' : 'transition-all'}
                            ${!swipeDirection?.startsWith('undo') && !isResetting ? 'duration-300' : ''}
                            ${isResetting ? 'duration-600' : ''}
                            ${swipeDirection === 'right' ? 'translate-x-full rotate-12 opacity-0' : ''}
                            ${swipeDirection === 'left' ? '-translate-x-full -rotate-12 opacity-0' : ''}
                            ${swipeDirection === 'undo-start' ? 'scale-50 opacity-0' : ''}
                            ${swipeDirection === 'undo-end' ? 'scale-100 opacity-100' : ''}
                            ${swipeDirection === 'instant-right' ? 'translate-x-[150%] rotate-6 opacity-100' : ''}
                            ${swipeDirection === 'instant-left' ? '-translate-x-[150%] -rotate-6 opacity-100' : ''}
                            ${swipeDirection === 'undo-from-right' ? 'translate-x-[120%] rotate-6 scale-95 opacity-0' : ''}
                            ${swipeDirection === 'undo-from-left' ? '-translate-x-[120%] -rotate-6 scale-95 opacity-0' : ''}
                        `}
                    >
                        {/* Pet image */}
                        <div className="absolute inset-0">
                            <img
                                src={getPetImageUrl(currentPet)}
                                alt={currentPet.name}
                                className="w-full h-full object-cover"
                            />
                            {/* Gradient overlay */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                        </div>

                        {/* Badges */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            {currentPet.atRisk && (
                                <span className="bg-red-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                                    Needs Home Urgently
                                </span>
                            )}
                            {currentPet.fosterable && (
                                <span className="bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium shadow-lg">
                                    Foster Available
                                </span>
                            )}
                        </div>

                        {/* Swipe indicators */}
                        <div className={`absolute top-1/3 left-8 transform -rotate-12 transition-opacity duration-200 ${swipeDirection === 'left' ? 'opacity-100' : 'opacity-0'
                            }`}>
                            <div className="border-4 border-red-500 text-red-500 px-6 py-2 rounded-lg font-bold text-2xl">
                                NOPE
                            </div>
                        </div>
                        <div className={`absolute top-1/3 right-8 transform rotate-12 transition-opacity duration-200 ${swipeDirection === 'right' ? 'opacity-100' : 'opacity-0'
                            }`}>
                            <div className="border-4 border-green-500 text-green-500 px-6 py-2 rounded-lg font-bold text-2xl">
                                LIKE
                            </div>
                        </div>

                        {/* Pet info */}
                        <CardContent className="absolute bottom-0 left-0 right-0 p-6 text-white">
                            <div className="flex items-end justify-between">
                                <div>
                                    <h2 className="text-3xl font-bold mb-1">{currentPet.name}</h2>
                                    <p className="text-lg opacity-90">{currentPet.breed}</p>
                                    <p className="text-sm opacity-75">
                                        {currentPet.species} • {currentPet.age} {currentPet.age === 1 ? 'year' : 'years'} old
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold">${getPetAdoptionFee(currentPet)}</p>
                                    <p className="text-xs opacity-75">adoption fee</p>
                                </div>
                            </div>

                            <p className="mt-4 text-sm opacity-90 line-clamp-2">
                                {currentPet.description}
                            </p>
                        </CardContent>
                    </Card>

                    {/* Next card (peek) */}
                    {petQueue[currentIndex + 1] && (
                        <Card className="absolute inset-0 overflow-hidden -z-10 scale-95 opacity-50">
                            <img
                                src={getPetImageUrl(petQueue[currentIndex + 1])}
                                alt="Next pet"
                                className="w-full h-full object-cover blur-sm"
                            />
                        </Card>
                    )}
                </div>
            </div>

            {/* Action buttons */}
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center gap-4">
                    {/* Undo button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleUndo}
                        disabled={!canUndo}
                        className="h-12 w-12 rounded-full"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo2 className="h-5 w-5" />
                    </Button>

                    {/* Pass button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePass}
                        disabled={isAnimating}
                        className="h-16 w-16 rounded-full border-2 border-red-400 hover:bg-red-50 hover:border-red-500 transition-all"
                        title="Pass (← Arrow)"
                    >
                        <X className="h-8 w-8 text-red-500" />
                    </Button>

                    {/* Like button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={handleLike}
                        disabled={isAnimating}
                        className="h-20 w-20 rounded-full border-2 border-green-400 hover:bg-green-50 hover:border-green-500 transition-all group"
                        title="Like (→ Arrow)"
                    >
                        <Heart className="h-10 w-10 text-green-500 group-hover:fill-green-500 transition-all" />
                    </Button>

                    {/* View details button */}
                    <Button
                        variant="outline"
                        size="icon"
                        asChild
                        className="h-12 w-12 rounded-full"
                        title="View full profile"
                    >
                        <Link to={`/pets/${currentPet.id}?origin=discover`}>
                            <Eye className="h-5 w-5" />
                        </Link>
                    </Button>
                </div>

                {/* Keyboard hints */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                    Use <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono">←</kbd> to pass,
                    <kbd className="px-1.5 py-0.5 bg-muted rounded text-[10px] font-mono ml-1">→</kbd> to like
                </p>
            </div>
        </div>
    );
}
