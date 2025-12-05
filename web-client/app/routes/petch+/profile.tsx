import { useLoaderData, Link, redirect, useRevalidator } from 'react-router';
import type { Route } from './+types/profile';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import type { User } from '~/types/auth';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { useEffect, useState } from 'react';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'My Profile - Petch' },
    { name: 'description', content: 'View and manage your profile' },
  ];
}

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);
  
  // Redirect to login if not authenticated
  if (!user || !token) {
    return redirect('/login?redirectTo=/profile');
  }

  return { user, token };
}

export default function ProfilePage() {
  const { user, token } = useLoaderData<typeof loader>();
  const revalidator = useRevalidator();
  const [vendorPets, setVendorPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isVendor = user.userType === 'VENDOR';
  const isAdopter = user.userType === 'ADOPTER';

  useEffect(() => {
    // Fetch full user data to get ID
    const fetchUserData = async () => {
      try {
        const response = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const userData = await response.json();
          setUserId(userData.id);
          
          // If vendor, fetch their pets
          if (isVendor) {
            fetchVendorPets(userData.id);
          }
        }
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      }
    };
    
    fetchUserData();
  }, [isVendor, token]);

  const fetchVendorPets = async (uid: number) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/pets/user/${uid}`);
      if (response.ok) {
        const pets = await response.json();
        setVendorPets(pets);
      }
    } catch (error) {
      console.error('Failed to fetch vendor pets:', error);
    }
    setLoading(false);
  };

  const handleDelete = async (petId: number) => {
    if(!confirm('Are you sure you want to delete this pet?')) {
      return;
    }

    try{
      setDeletingId(petId);
      const response = await fetch(`http://localhost:8080/api/pets/${petId}`, {
        method: 'DELETE',
        headers:{
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if(!response.ok){
        throw new Error(`Failed to delete pet: ${response.status}`);
      }

      //Refresh the pet list
      if(userId){
        fetchVendorPets(userId);
      }
    }catch(error){
      alert('Failed to delete pet: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }finally{
      setDeletingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">My Profile</h1>
            <Button asChild variant="outline">
              <Link to="/pets">← Back to Pets</Link>
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Sidebar - User Info */}
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Account Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Name</p>
                  <p className="text-lg font-semibold">
                    {user.firstName} {user.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p className="text-lg">{user.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Account Type</p>
                  <p className="text-lg font-medium">
                    {isVendor ? '🏠 Vendor' : isAdopter ? '👤 Adopter' : 'User'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Vendor Profile */}
            {isVendor && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>My Shelter/Vendor Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Welcome to your vendor dashboard! Manage your pet listings below.
                    </p>
                    <div className="pt-4">
                      <Button asChild>
                        <Link to="/pets/create">Create New Listing</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Pet Listings ({vendorPets.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {loading ? (
                      <p className="text-muted-foreground">Loading your pets...</p>
                    ) : vendorPets.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-muted-foreground mb-4">You haven't created any listings yet.</p>
                        <Button asChild>
                          <Link to="/pets/create">Create Your First Listing</Link>
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4">
                        {vendorPets.map((pet) => (
                          <div key={pet.id} className="border rounded-lg p-4 hover:bg-accent transition">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-semibold text-lg">{pet.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {pet.species} • {pet.breed} • {pet.age} years old
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <Button asChild variant="outline" size="sm">
                                  <Link to={`/pets/${pet.id}`}>View</Link>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDelete(pet.id)}
                                  disabled={deletingId === pet.id}
                                >
                                  {deletingId === pet.id ? 'Deleting...' : 'Delete'}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {/* Adopter Profile */}
            {isAdopter && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Welcome to Petch</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">
                      Start your journey to find your perfect furry friend!
                    </p>
                    <div className="pt-4 flex gap-4">
                      <Button asChild>
                        <Link to="/pets">Browse All Pets</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Generic Profile - if user type is something else */}
            {!isVendor && !isAdopter && (
              <Card>
                <CardHeader>
                  <CardTitle>Welcome to Petch</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    Your profile page. Start browsing available pets!
                  </p>
                  <div className="mt-4">
                    <Button asChild>
                      <Link to="/pets">Browse Pets</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
