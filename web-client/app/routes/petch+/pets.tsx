import { useLoaderData, Link, useFetcher, useSearchParams, useNavigate } from 'react-router';
import type { Route } from './+types/pets';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { useState, useEffect } from 'react';
import { getSession } from '~/services/session.server';
import { getUserFromSession } from '~/services/auth';
import { ChevronLeft, ChevronRight, AlertTriangle, Heart, Loader2, Dog } from 'lucide-react';
import { API_BASE_URL, getImageUrl } from '~/config/api-config';
import { PLACEHOLDER_IMAGES } from '~/config/constants';
import type { Pet } from '~/types/pet';

const PETS_PER_PAGE = 12;

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'All Pets - Petch' },
    { name: 'description', content: 'Browse all available pets' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  const url = new URL(request.url);

  // Extract filter params from URL
  const species = url.searchParams.get('species');
  const ageRange = url.searchParams.get('ageRange');
  const fosterable = url.searchParams.get('fosterable') === 'true';
  const atRisk = url.searchParams.get('atRisk') === 'true';
  const search = url.searchParams.get('search') || '';
  const page = parseInt(url.searchParams.get('page') || '1', 10) - 1; // Backend is 0-indexed

  // Build backend query string
  const queryParams = new URLSearchParams();

  if (search) {
    queryParams.set('search', search);
  }

  if (species && species !== 'all') {
    queryParams.set('species', species);
  }

  // Convert age range to min/max
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

  if (fosterable) {
    queryParams.set('fosterable', 'true');
  }

  if (atRisk) {
    queryParams.set('atRisk', 'true');
  }

  queryParams.set('page', page.toString());
  queryParams.set('size', PETS_PER_PAGE.toString());

  try {
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');

    const apiUrl = `${API_BASE_URL}/api/pets?${queryParams.toString()}`;
    const response = await fetch(apiUrl, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Backend returned ${response.status}`);
      return {
        pets: [],
        totalPets: 0,
        totalPages: 0,
        currentPage: 1,
        user,
        filters: { species, ageRange, fosterable, atRisk, search }
      };
    }

    const data = await response.json();

    // Backend returns Spring Page object
    return {
      pets: data.content || [],
      totalPets: data.totalElements || 0,
      totalPages: data.totalPages || 0,
      currentPage: (data.number || 0) + 1, // Convert to 1-indexed for UI
      user,
      filters: { species, ageRange, fosterable, atRisk, search }
    };
  } catch (error) {
    console.error('Failed to fetch pets:', error);
    return {
      pets: [],
      totalPets: 0,
      totalPages: 0,
      currentPage: 1,
      user,
      filters: { species, ageRange, fosterable, atRisk }
    };
  }
}

// Server action for deleting pets (keeps token secure on server)
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const petId = formData.get('petId');

  if (!petId) {
    return { error: 'Pet ID is required' };
  }

  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');

  if (!token) {
    return { error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/pets/${petId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return { error: `Failed to delete pet: ${response.status}` };
    }

    return { success: true };
  } catch (error) {
    return { error: 'Failed to delete pet' };
  }
}

export default function PetsPage() {
  const { pets, totalPets, totalPages, currentPage, user, filters } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const fetcher = useFetcher();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [isFiltering, setIsFiltering] = useState(false);
  const [showPageInput, setShowPageInput] = useState(false);
  const [pageInputValue, setPageInputValue] = useState('');

  // Filter state - initialize from URL params
  const [selectedSpecies, setSelectedSpecies] = useState<string>(filters.species || 'all');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>(filters.ageRange || 'all');
  const [filterFosterable, setFilterFosterable] = useState<boolean>(filters.fosterable);
  const [filterAtRisk, setFilterAtRisk] = useState<boolean>(filters.atRisk);
  const [searchQuery, setSearchQuery] = useState<string>(filters.search || '');

  // Update URL when filters change
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

  // Reset filtering state when data loads
  useEffect(() => {
    setIsFiltering(false);
  }, [pets]);

  const handleDelete = (petId: number) => {
    if (!confirm('Are you sure you want to delete this pet?')) {
      return;
    }
    setDeletingId(petId);
    fetcher.submit(
      { petId: petId.toString() },
      { method: 'POST' }
    );
  };

  // Reset deletingId when fetcher completes
  if (fetcher.state === 'idle' && deletingId !== null) {
    setDeletingId(null);
  }

  // Clear filters and reset to page 1
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

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 7;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (!pages.includes(totalPages)) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  // Helper to get image URL
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-8 pb-6 text-center border-b sticky top-16 bg-background z-40 shadow-sm">
        <h1 className="text-5xl font-bold primary-text tracking-tight center-text mb-2">
          <span className="text-coral"> Pet Listings </span>
        </h1>
        <p className="text-xl text-muted-foreground ">
          Find your perfect companion • {totalPets} pets available
        </p>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="w-full bg-white rounded-lg border shadow-sm p-4">
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
                  <SelectItem value="0-2">0-2 years (Young)</SelectItem>
                  <SelectItem value="3-5">3-5 years (Adult)</SelectItem>
                  <SelectItem value="6-10">6-10 years (Mature)</SelectItem>
                  <SelectItem value="10+">10+ years (Senior)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Fosterable Checkbox */}
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
                Fosterable Only
              </Label>
            </div>

            {/* At Risk Checkbox */}
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
                At Risk Only
              </Label>
            </div>

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearFilters}
              className="ml-auto"
            >
              Clear Filters
            </Button>
          </div>

          {/* Active filters summary */}
          {(selectedSpecies !== 'all' || selectedAgeRange !== 'all' || filterFosterable || filterAtRisk) && (
            <div className="mt-3 pt-3 border-t text-sm text-muted-foreground">
              Showing {totalPets} {totalPets === 1 ? 'pet' : 'pets'}
              {selectedSpecies !== 'all' && ` • Species: ${selectedSpecies}`}
              {selectedAgeRange !== 'all' && ` • Age: ${selectedAgeRange} years`}
              {filterFosterable && ' • Fosterable'}
              {filterAtRisk && ' • At Risk'}
            </div>
          )}
        </div>
      </div>

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
      <div className="container mx-auto px-4 py-6">
        {pets.length === 0 ? (
          <div className="text-center py-12">
            <div className="size-16 rounded-xl bg-coral/10 flex items-center justify-center mx-auto mb-4">
              <Dog className="w-8 h-8 text-coral" />
            </div>
            <p className="text-lg text-muted-foreground mb-2">
              No pets found matching your filters.
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Try adjusting your search criteria or clear filters to see all available pets.
            </p>
            <Button variant="outline" onClick={handleClearFilters}>
              Clear All Filters
            </Button>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pets.map((pet: Pet) => (
                <Card key={pet.id} className="relative group overflow-hidden border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 bg-card/50 hover:bg-card">
                  {/* At Risk Badge - Kept as high priority signal */}
                  {pet.atRisk && (
                    <div className="absolute top-3 left-3 z-10 bg-red-500/90 backdrop-blur-sm text-white px-2.5 py-1 rounded-full text-xs font-medium shadow-sm">
                      Needs Home Urgently
                    </div>
                  )}

                  {/* Pet Image */}
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    <Link to={`/pets/${pet.id}`}>
                      <img
                        src={getPetImageUrl(pet)}
                        alt={pet.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                      {/* Gradient overlay for text readability if we wanted, but clean is nice for now */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    </Link>
                  </div>

                  <CardHeader className="pb-2 pt-4">
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <CardTitle className="text-xl font-bold tracking-tight mb-1">
                          <Link to={`/pets/${pet.id}`} className="hover:text-coral transition-colors">
                            {pet.name}
                          </Link>
                        </CardTitle>
                        <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                          {pet.breed}
                          <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                          {pet.age} {pet.age === 1 ? 'year' : 'years'} old
                        </p>
                      </div>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    {/* Tags Row */}
                    <div className="flex gap-2 flex-wrap">
                      {pet.species && (
                        <span className="px-2.5 py-0.5 bg-secondary text-secondary-foreground rounded-md text-xs font-medium border border-border/50">
                          {pet.species}
                        </span>
                      )}
                      {pet.fosterable && (
                        <span className="px-2.5 py-0.5 bg-green-50 text-green-700 border border-green-100 rounded-md text-xs font-medium flex items-center gap-1">
                          <Heart className="w-3 h-3 fill-green-700/20" />
                          Fosterable
                        </span>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {pet.description}
                    </p>

                    <div className="pt-2 flex items-center justify-between gap-4 border-t border-border/40 mt-auto">
                      {/* Price moved to bottom, neutral styling */}
                      {pet.adoptionDetails?.priceEstimate ? (
                        <div className="text-xs font-medium text-muted-foreground/80 flex flex-col">
                          Adoption Fee
                          <span className="text-sm text-foreground font-semibold">
                            ${pet.adoptionDetails.priceEstimate}
                          </span>
                        </div>
                      ) : (
                        <div className="text-xs font-medium text-muted-foreground/80">
                          Inquire for Fee
                        </div>
                      )}

                      <Button
                        variant="outline"
                        className="group/btn border-coral/20 text-coral hover:bg-coral hover:text-white hover:border-coral transition-all duration-300"
                        asChild
                      >
                        <Link to={`/pets/${pet.id}`} className="flex items-center gap-2">
                          Meet {pet.name}
                          <ChevronRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-0.5" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-2 mt-8 pb-8">
                {/* Previous Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {getPageNumbers().map((page, index) => (
                    typeof page === 'number' ? (
                      <Button
                        key={index}
                        variant={currentPage === page ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => goToPage(page)}
                        className="w-10 h-10"
                      >
                        {page}
                      </Button>
                    ) : (
                      <div key={index} className="relative">
                        {showPageInput ? (
                          <form
                            onSubmit={(e) => {
                              e.preventDefault();
                              const pageNum = parseInt(pageInputValue, 10);
                              if (pageNum >= 1 && pageNum <= totalPages) {
                                goToPage(pageNum);
                              }
                              setShowPageInput(false);
                              setPageInputValue('');
                            }}
                            className="flex items-center gap-1"
                          >
                            <input
                              type="number"
                              min={1}
                              max={totalPages}
                              value={pageInputValue}
                              onChange={(e) => setPageInputValue(e.target.value)}
                              className="w-16 h-10 text-center border rounded-md text-sm"
                              autoFocus
                              placeholder={`1-${totalPages}`}
                            />
                            <Button type="submit" size="sm" variant="outline" className="h-10">
                              Go
                            </Button>
                          </form>
                        ) : (
                          <button
                            onClick={() => setShowPageInput(true)}
                            className="px-2 text-muted-foreground hover:text-coral cursor-pointer"
                          >
                            ...
                          </button>
                        )}
                      </div>
                    )
                  ))}
                </div>

                {/* Next Button */}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1"
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}

            {/* Page Info */}
            <div className="text-center text-sm text-muted-foreground pb-8">
              Showing {startIndex + 1}-{endIndex} of {totalPets} pets
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}