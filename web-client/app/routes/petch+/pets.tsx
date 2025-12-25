import { useLoaderData, Link, useFetcher, useSearchParams } from 'react-router';
import type { Route } from './+types/pets';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { PawIcon } from '~/components/ui/paw-icon';
import { useState, useMemo } from 'react';
import { getSession } from '~/services/session.server';
import { getUserFromSession } from '~/services/auth';
import { FAKE_PETS, PETS_PER_PAGE, type FakePet } from '~/data/fake-pets';
import { ChevronLeft, ChevronRight, AlertTriangle, Heart } from 'lucide-react';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8080';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'All Pets - Petch' },
    { name: 'description', content: 'Browse all available pets' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);

  try {
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');

    const response = await fetch(`${API_BASE_URL}/api/pets`, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      console.error(`Backend returned ${response.status}`);
      return { pets: [], user };
    }

    const pets = await response.json();
    return { pets, user };
  } catch (error) {
    console.error('Failed to fetch pets:', error);
    return { pets: [], user };
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
  const { pets: apiPets, user } = useLoaderData<typeof loader>();
  const [searchParams, setSearchParams] = useSearchParams();
  const fetcher = useFetcher();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filter state
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('all');
  const [filterFosterable, setFilterFosterable] = useState<boolean>(false);
  const [filterAtRisk, setFilterAtRisk] = useState<boolean>(false);

  // Pagination state
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  // Combine API pets with fake pets for demo
  // In production, this would just be apiPets
  const allPets = useMemo(() => {
    // Convert fake pets to match API pet format
    const fakePetsFormatted = FAKE_PETS.map(pet => ({
      id: pet.id,
      name: pet.name,
      species: pet.species,
      breed: pet.breed,
      age: pet.age,
      description: pet.description,
      atRisk: pet.atRisk,
      fosterable: pet.fosterable,
      images: [{ filePath: pet.imageUrl, altText: pet.name, isExternal: true }],
      adoptionDetails: {
        priceEstimate: pet.priceEstimate,
        stepsDescription: pet.stepsDescription,
      },
    }));

    // Combine: API pets first (real data), then fake pets
    return [...apiPets, ...fakePetsFormatted];
  }, [apiPets]);

  // Apply filters
  const filteredPets = useMemo(() => {
    return allPets.filter((pet: any) => {
      // Species filter
      if (selectedSpecies !== 'all') {
        const petSpecies = pet.species?.toLowerCase() || '';
        const filterSpecies = selectedSpecies.toLowerCase();

        // Handle "other" category
        if (filterSpecies === 'other') {
          const mainSpecies = ['dog', 'cat', 'bird', 'rabbit'];
          if (mainSpecies.includes(petSpecies)) return false;
        } else if (petSpecies !== filterSpecies) {
          return false;
        }
      }

      // Age range filter
      if (selectedAgeRange !== 'all') {
        const age = pet.age || 0;
        switch (selectedAgeRange) {
          case '0-2':
            if (age < 0 || age > 2) return false;
            break;
          case '3-5':
            if (age < 3 || age > 5) return false;
            break;
          case '6-10':
            if (age < 6 || age > 10) return false;
            break;
          case '10+':
            if (age < 10) return false;
            break;
        }
      }

      // Fosterable filter
      if (filterFosterable && !pet.fosterable) return false;

      // At Risk filter
      if (filterAtRisk && !pet.atRisk) return false;

      return true;
    });
  }, [allPets, selectedSpecies, selectedAgeRange, filterFosterable, filterAtRisk]);

  // Pagination calculations
  const totalPets = filteredPets.length;
  const totalPages = Math.ceil(totalPets / PETS_PER_PAGE);
  const startIndex = (currentPage - 1) * PETS_PER_PAGE;
  const endIndex = startIndex + PETS_PER_PAGE;
  const paginatedPets = filteredPets.slice(startIndex, endIndex);

  // Ensure current page is valid
  const validPage = Math.max(1, Math.min(currentPage, totalPages || 1));
  if (currentPage !== validPage && totalPages > 0) {
    setSearchParams({ page: validPage.toString() });
  }

  const goToPage = (page: number) => {
    setSearchParams({ page: page.toString() });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    setSearchParams({ page: '1' });
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-8 pb-6 text-center border-b sticky top-16 bg-background z-40 shadow-sm">
        <h1 className="text-5xl font-bold primary-text tracking-tight center-text mb-2">
          <span className="text-primary"> Pet Listings </span>
        </h1>
        <p className="text-xl text-muted-foreground ">
          Find your perfect companion • {totalPets} pets available
        </p>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <div className="w-full bg-white rounded-lg border shadow-sm p-4">
          <div className="flex flex-wrap items-center gap-6">
            {/* Species Filter */}
            <div className="flex items-center gap-2">
              <Label htmlFor="species-filter" className="text-sm font-medium whitespace-nowrap">
                Species:
              </Label>
              <Select value={selectedSpecies} onValueChange={(value) => {
                setSelectedSpecies(value);
                setSearchParams({ page: '1' });
              }}>
                <SelectTrigger id="species-filter" className="w-[140px]">
                  <SelectValue placeholder="All Species" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Species</SelectItem>
                  <SelectItem value="dog">Dog</SelectItem>
                  <SelectItem value="cat">Cat</SelectItem>
                  <SelectItem value="bird">Bird</SelectItem>
                  <SelectItem value="rabbit">Rabbit</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
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
                setSearchParams({ page: '1' });
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
                  setSearchParams({ page: '1' });
                }}
              />
              <Label htmlFor="fosterable-filter" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                <Heart className="w-4 h-4 text-green-600" />
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
                  setSearchParams({ page: '1' });
                }}
              />
              <Label htmlFor="atrisk-filter" className="text-sm font-medium cursor-pointer flex items-center gap-1">
                <AlertTriangle className="w-4 h-4 text-orange-600" />
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

      {/* Pets Grid */}
      <div className="container mx-auto px-4 py-6">
        {paginatedPets.length === 0 ? (
          <div className="text-center py-12">
            <PawIcon className="w-16 h-16 mx-auto mb-4 opacity-30" />
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
              {paginatedPets.map((pet: any) => (
                <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow relative">
                  {/* At Risk Badge */}
                  {pet.atRisk && (
                    <div className="absolute top-3 left-3 z-10 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Needs Home Urgently
                    </div>
                  )}

                  {/* Pet Image */}
                  {pet.images && pet.images.length > 0 ? (
                    <div className="w-full aspect-[4/3] overflow-hidden bg-gray-100 group cursor-pointer relative">
                      <img
                        src={pet.images[0].isExternal
                          ? pet.images[0].filePath
                          : `http://localhost:8080${pet.images[0].filePath}`}
                        alt={pet.images[0].altText || pet.name}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-64 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                      <PawIcon className="w-16 h-16" />
                    </div>
                  )}

                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <span>{pet.name}</span>
                      {pet.adoptionDetails?.priceEstimate && (
                        <span className="text-lg font-normal text-primary">
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
                        <span className="px-2 py-1 bg-primary/10 rounded text-xs">
                          {pet.species}
                        </span>
                      )}
                      {pet.fosterable && (
                        <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs flex items-center gap-1">
                          <Heart className="w-3 h-3" />
                          Fosterable
                        </span>
                      )}
                      {pet.atRisk && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs">
                          At Risk
                        </span>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button className="flex-1" asChild>
                        <Link to={`/pets/${pet.id}`}>View Details</Link>
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
                      <span key={index} className="px-2 text-muted-foreground">
                        {page}
                      </span>
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
              Showing {startIndex + 1}-{Math.min(endIndex, totalPets)} of {totalPets} pets
              {totalPages > 1 && ` • Page ${currentPage} of ${totalPages}`}
            </div>
          </>
        )}
      </div>
    </div>
  );
}