import { useLoaderData, Link, useRevalidator } from 'react-router';
import type { Route } from './+types/pets';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useState } from 'react';
import { getSession } from '~/services/session.server';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'All Pets - Petch' },
    { name: 'description', content: 'Browse all available pets' },
  ];
}

export async function loader({ request }: Route.LoaderArgs){
  try{
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');

    const response = await fetch('http://localhost:8080/api/pets',{
      headers:{
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
      cache: 'no-store',
    });
    
    if(!response.ok){
      console.error(`Backend returned ${response.status}`);
      return { pets: [], token };
    }
    
    const pets = await response.json();
    return{ pets, token };
  }catch (error){
    console.error('Failed to fetch pets:', error);
    return { pets: [], token: null };
  }
}

export default function PetsPage(){
  const { pets, token } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const handleDelete = async (petId: number) => {
    if(!confirm('Are you sure you want to delete this pet?')){
      return;
    }

    try{
      setDeletingId(petId);
      const response = await fetch(`http://localhost:8080/api/pets/${petId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if(!response.ok){
        throw new Error(`Failed to delete pet: ${response.status}`);
      }

      // Revalidate to refresh the pet list
      revalidator.revalidate();
    }catch (error){
      alert('Failed to delete pet: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }finally{
      setDeletingId(null);
    }
  };

  return(
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Available Pets</h1>
              <p className="text-muted-foreground mt-2">
                {pets.length} pets waiting for their forever home
              </p>
            </div>
            <div className="flex gap-2">
              <Button asChild variant="default">
                <Link to="/profile">My Profile</Link>
              </Button>
              <Button asChild variant="outline">
                <Link to="/">← Back to Home</Link>
              </Button>
            </div>
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