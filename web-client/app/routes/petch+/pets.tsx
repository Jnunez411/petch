import { useLoaderData, Link, useRevalidator, useFetcher } from 'react-router';
import type { Route } from './+types/pets';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { PawIcon } from '~/components/ui/paw-icon';
import { useState } from 'react';
import { getSession } from '~/services/session.server';
import { getUserFromSession } from '~/services/auth';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8080';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'All Pets - Petch' },
    { name: 'description', content: 'Browse all available pets' },
  ];
}

export async function loader({ request }: Route.LoaderArgs){
  const user = await getUserFromSession(request);
  
  try{
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');

    const response = await fetch(`${API_BASE_URL}/api/pets`,{
      headers:{
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      cache: 'no-store',
    });
    
    if(!response.ok){
      console.error(`Backend returned ${response.status}`);
      return { pets: [], user };
    }
    
    const pets = await response.json();
    return{ pets, user };
  }catch (error){
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

export default function PetsPage(){
  const { pets, user } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Filter state (UI only - backend integration pending)
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');
  const [selectedAgeRange, setSelectedAgeRange] = useState<string>('all');
  const [filterFosterable, setFilterFosterable] = useState<boolean>(false);
  const [filterAtRisk, setFilterAtRisk] = useState<boolean>(false);

  const handleDelete = (petId: number) => {
    if(!confirm('Are you sure you want to delete this pet?')){
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

  return(
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="pt-8 pb-6 text-center border-b sticky top-16 bg-background z-40 shadow-sm">
          <h1 className="text-5xl font-bold primary-text tracking-tight center-text mb-2">
              <span className="text-primary"> Pet Listings </span>
          </h1>
          <p className="text-xl text-muted-foreground ">
            All available pets
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
              <Select value={selectedSpecies} onValueChange={setSelectedSpecies}>
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
              <Select value={selectedAgeRange} onValueChange={setSelectedAgeRange}>
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

            {/* Fosterable Checkbox */}
            <div className="flex items-center gap-2">
              <Checkbox
                id="fosterable-filter"
                checked={filterFosterable}
                onCheckedChange={(checked) => setFilterFosterable(checked as boolean)}
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
                onCheckedChange={(checked) => setFilterAtRisk(checked as boolean)}
              />
              <Label htmlFor="atrisk-filter" className="text-sm font-medium cursor-pointer">
                At Risk Only
              </Label>
            </div>

            {/* Clear Filters Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSpecies('all');
                setSelectedAgeRange('all');
                setFilterFosterable(false);
                setFilterAtRisk(false);
              }}
              className="ml-auto"
            >
              Clear Filters
            </Button>
          </div>
        </div>
      </div>
      {/* Pets Grid */}
      <div className="container mx-auto px-4 py-12">
        {pets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No pets available at the moment.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pets.map((pet: any) => (
              <Card key={pet.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                {/* Pet Image */}
                {pet.images && pet.images.length > 0 ? (
                  <div className="w-full aspect-[4/3] overflow-hidden 
                      bg-gray-100 group cursor-pointer relative">
                    <img

                      src={`http://localhost:8080${pet.images[0].filePath}`}
                      alt={pet.images[0].altText || pet.name}
                      className="w-full h-full object-cover 
                        transition-transform group-hover:scale-105"
                    />
                  </div>
                ) : (
                  <div className="w-full h-64 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                    <PawIcon className="w-16 h-16" />
                  </div>
                )}

                <CardHeader className="pb-3">
                  <CardTitle>{pet.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {pet.breed} • {pet.age} years old
                  </p>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm">{pet.description}</p>
                  <div className="flex gap-2 flex-wrap">
                    {pet.species && (
                      <span className="px-2 py-1 bg-primary/10 rounded text-xs">
                        {pet.species}
                      </span>
                    )}
                    {pet.fosterable && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
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
                    <Button className="flex-1"  asChild>
                      <Link to={`/pets/${pet.id}`}>View Details</Link>
                    </Button>
                    {/* <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(pet.id)}
                      disabled={deletingId === pet.id}
                    >
                      {deletingId === pet.id ? 'Deleting...' : 'Delete'}
                    </Button> */}
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