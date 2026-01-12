import { useLoaderData, Link, useFetcher, useSearchParams } from 'react-router';
import type { Route } from './+types/admin.listings';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { useState, useEffect } from 'react';
import { getSession } from '~/services/session.server';
import { ChevronLeft, ChevronRight, AlertTriangle, Heart, Loader2, Dog } from 'lucide-react';
import { API_BASE_URL, getImageUrl } from '~/config/api-config';
import { PLACEHOLDER_IMAGES } from '~/config/constants';
import type { Pet } from '~/types/pet';

const PETS_PER_PAGE = 12;

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Pet Listings - Admin' },
        { name: 'description', content: 'Browse all available pets' },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const url = new URL(request.url);

    const species = url.searchParams.get('species');
    const ageRange = url.searchParams.get('ageRange');
    const fosterable = url.searchParams.get('fosterable') === 'true';
    const atRisk = url.searchParams.get('atRisk') === 'true';
    const search = url.searchParams.get('search') || '';
    const page = parseInt(url.searchParams.get('page') || '1', 10) - 1;

    const queryParams = new URLSearchParams();

    if (search) {
        queryParams.set('search', search);
    }

    if (species && species !== 'all') {
        queryParams.set('species', species);
    }

    if (ageRange && ageRange !== 'all') {
        switch (ageRange) {
            case '0-2':
                queryParams.set('ageMin', '0');
                queryParams.set('ageMax', '2');
                break;
            case '3-5':
                queryParams.set('ageMin', '3');
                queryParams.set('ageMax', '5');
                break;
            case '6-10':
                queryParams.set('ageMin', '6');
                queryParams.set('ageMax', '10');
                break;
            case '10+':
                queryParams.set('ageMin', '10');
                break;
        }
    }

    if (fosterable) queryParams.set('fosterable', 'true');
    if (atRisk) queryParams.set('atRisk', 'true');

    queryParams.set('page', page.toString());
    queryParams.set('size', PETS_PER_PAGE.toString());

    try {
        const session = await getSession(request.headers.get('Cookie'));
        const token = session.get('token');

        const apiUrl = `${API_BASE_URL}/api/pets?${queryParams.toString()}`;
        const response = await fetch(apiUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token ? `Bearer ${token}` : '',
            },
        });

        if (!response.ok) {
            return {
                pets: [],
                totalPets: 0,
                totalPages: 0,
                currentPage: 1,
                filters: { species, ageRange, fosterable, atRisk, search }
            };
        }

        const data = await response.json();

        return {
            pets: data.content || [],
            totalPets: data.totalElements || 0,
            totalPages: data.totalPages || 0,
            currentPage: (data.number || 0) + 1,
            filters: { species, ageRange, fosterable, atRisk, search }
        };
    } catch (error) {
        return {
            pets: [],
            totalPets: 0,
            totalPages: 0,
            currentPage: 1,
            filters: { species, ageRange, fosterable, atRisk, search }
        };
    }
}

export default function AdminListings() {
    const { pets, totalPets, totalPages, currentPage, filters } = useLoaderData<typeof loader>();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isFiltering, setIsFiltering] = useState(false);

    const [selectedSpecies, setSelectedSpecies] = useState<string>(filters.species || 'all');
    const [selectedAgeRange, setSelectedAgeRange] = useState<string>(filters.ageRange || 'all');
    const [filterFosterable, setFilterFosterable] = useState<boolean>(filters.fosterable);
    const [filterAtRisk, setFilterAtRisk] = useState<boolean>(filters.atRisk);
    const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');

    const applyFilters = (newFilters: {
        species?: string;
        ageRange?: string;
        fosterable?: boolean;
        atRisk?: boolean;
        search?: string;
        page?: number;
    }) => {
        setIsFiltering(true);
        const params = new URLSearchParams();

        const species = newFilters.species ?? selectedSpecies;
        const ageRange = newFilters.ageRange ?? selectedAgeRange;
        const fosterable = newFilters.fosterable ?? filterFosterable;
        const atRisk = newFilters.atRisk ?? filterAtRisk;
        const search = newFilters.search ?? searchQuery;
        const page = newFilters.page ?? 1;

        if (search) params.set('search', search);
        if (species && species !== 'all') params.set('species', species);
        if (ageRange && ageRange !== 'all') params.set('ageRange', ageRange);
        if (fosterable) params.set('fosterable', 'true');
        if (atRisk) params.set('atRisk', 'true');
        if (page > 1) params.set('page', page.toString());

        setSearchParams(params);
    };

    useEffect(() => {
        setIsFiltering(false);
    }, [pets]);

    const handleClearFilters = () => {
        setSelectedSpecies('all');
        setSelectedAgeRange('all');
        setFilterFosterable(false);
        setFilterAtRisk(false);
        setSearchQuery('');
        setSearchParams({});
    };

    const goToPage = (page: number) => {
        applyFilters({ page });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const getPetImageUrl = (pet: Pet) => {
        if (pet.images && pet.images.length > 0) {
            const imageUrl = getImageUrl(pet.images[0].filePath);
            if (imageUrl) return imageUrl;
        }
        return PLACEHOLDER_IMAGES[pet.species] || PLACEHOLDER_IMAGES.default;
    };

    const startIndex = (currentPage - 1) * PETS_PER_PAGE;
    const endIndex = Math.min(startIndex + PETS_PER_PAGE, totalPets);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold">Pet Listings</h1>
                <p className="text-muted-foreground mt-2">
                    Browse all available pets • {totalPets} pets available
                </p>
            </div>

            {/* Filters Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-6">
                        {/* Search Input */}
                        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                            <input
                                type="text"
                                placeholder="Search by name, breed..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        applyFilters({ search: searchQuery, page: 1 });
                                    }
                                }}
                                className="px-4 py-2 border rounded-lg bg-background text-foreground w-full focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                            <Button
                                size="sm"
                                onClick={() => applyFilters({ search: searchQuery, page: 1 })}
                            >
                                Search
                            </Button>
                        </div>

                        {/* Species Filter */}
                        <div className="flex items-center gap-2">
                            <Label htmlFor="species-filter" className="text-sm font-medium whitespace-nowrap">
                                Species:
                            </Label>
                            <Select value={selectedSpecies} onValueChange={(value) => {
                                setSelectedSpecies(value);
                                applyFilters({ species: value, page: 1 });
                            }}>
                                <SelectTrigger id="species-filter" className="w-[140px]">
                                    <SelectValue placeholder="All Species" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Species</SelectItem>
                                    <SelectItem value="Dog">Dog</SelectItem>
                                    <SelectItem value="Cat">Cat</SelectItem>
                                    <SelectItem value="Bird">Bird</SelectItem>
                                    <SelectItem value="Rabbit">Rabbit</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Age Range Filter */}
                        <div className="flex items-center gap-2">
                            <Label htmlFor="age-filter" className="text-sm font-medium whitespace-nowrap">
                                Age:
                            </Label>
                            <Select value={selectedAgeRange} onValueChange={(value) => {
                                setSelectedAgeRange(value);
                                applyFilters({ ageRange: value, page: 1 });
                            }}>
                                <SelectTrigger id="age-filter" className="w-[140px]">
                                    <SelectValue placeholder="All Ages" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Ages</SelectItem>
                                    <SelectItem value="0-2">0-2 years</SelectItem>
                                    <SelectItem value="3-5">3-5 years</SelectItem>
                                    <SelectItem value="6-10">6-10 years</SelectItem>
                                    <SelectItem value="10+">10+ years</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Checkboxes */}
                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="fosterable-filter"
                                checked={filterFosterable}
                                onCheckedChange={(checked) => {
                                    setFilterFosterable(checked as boolean);
                                    applyFilters({ fosterable: checked as boolean, page: 1 });
                                }}
                            />
                            <Label htmlFor="fosterable-filter" className="text-sm font-medium cursor-pointer">
                                Fosterable
                            </Label>
                        </div>

                        <div className="flex items-center gap-2">
                            <Checkbox
                                id="atrisk-filter"
                                checked={filterAtRisk}
                                onCheckedChange={(checked) => {
                                    setFilterAtRisk(checked as boolean);
                                    applyFilters({ atRisk: checked as boolean, page: 1 });
                                }}
                            />
                            <Label htmlFor="atrisk-filter" className="text-sm font-medium cursor-pointer">
                                At Risk
                            </Label>
                        </div>

                        <Button variant="outline" size="sm" onClick={handleClearFilters} className="ml-auto">
                            Clear Filters
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Loading Overlay */}
            {isFiltering && (
                <div className="fixed inset-0 bg-background/50 z-50 flex items-center justify-center">
                    <div className="flex items-center gap-2 bg-white p-4 rounded-lg shadow-lg">
                        <Loader2 className="w-6 h-6 animate-spin text-coral" />
                        <span>Filtering...</span>
                    </div>
                </div>
            )}

            {/* Pets Grid */}
            {pets.length === 0 ? (
                <div className="text-center py-12">
                    <div className="size-16 rounded-xl bg-coral/10 flex items-center justify-center mx-auto mb-4">
                        <Dog className="w-8 h-8 text-coral" />
                    </div>
                    <p className="text-lg text-muted-foreground mb-2">
                        No pets found matching your filters.
                    </p>
                    <Button variant="outline" onClick={handleClearFilters}>
                        Clear All Filters
                    </Button>
                </div>
            ) : (
                <>
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {pets.map((pet: Pet) => (
                            <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow relative">
                                {pet.atRisk && (
                                    <div className="absolute top-3 left-3 z-10 bg-red-500 text-white px-2 py-1 rounded-full text-xs font-semibold">
                                        Needs Home Urgently
                                    </div>
                                )}

                                <Link to={`/pets/${pet.id}`} className="block w-full aspect-[4/3] overflow-hidden bg-gray-100 group cursor-pointer">
                                    <img
                                        src={getPetImageUrl(pet)}
                                        alt={pet.name}
                                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                        loading="lazy"
                                    />
                                </Link>

                                <CardHeader className="pb-3">
                                    <CardTitle className="flex items-center justify-between">
                                        <span>{pet.name}</span>
                                        {pet.adoptionDetails?.priceEstimate && (
                                            <span className="text-lg font-normal text-coral">
                                                ${pet.adoptionDetails.priceEstimate}
                                            </span>
                                        )}
                                    </CardTitle>
                                    <p className="text-sm text-muted-foreground">
                                        {pet.breed} • {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                                    </p>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm line-clamp-2">{pet.description}</p>
                                    <div className="flex gap-2 flex-wrap">
                                        {pet.species && (
                                            <span className="px-2 py-1 bg-coral/10 rounded text-xs">
                                                {pet.species}
                                            </span>
                                        )}
                                        {pet.fosterable && (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                                                Fosterable
                                            </span>
                                        )}
                                    </div>
                                    <Button className="w-full" asChild>
                                        <Link to={`/pets/${pet.id}`}>View Details</Link>
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between border-t pt-4">
                            <p className="text-sm text-muted-foreground">
                                Showing {startIndex + 1}-{endIndex} of {totalPets} pets
                            </p>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Previous
                                </Button>
                                <span className="flex items-center px-3 text-sm">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
