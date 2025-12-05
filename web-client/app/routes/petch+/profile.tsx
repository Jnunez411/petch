import { useLoaderData, Link, redirect, useRevalidator, Form, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/profile';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { authenticatedFetch } from '~/utils/api';
import type { User } from '~/types/auth';
import type { AdopterProfile } from '~/types/adopter';
import type { VendorProfile } from '~/types/vendor';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
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

  // Fetch adopter profile if user is adopter
  let adopterProfile: AdopterProfile | null = null;
  if (user.userType === 'ADOPTER') {
    try {
      const response = await authenticatedFetch(request, '/api/users/me/adopter-profile');
      if (response.ok) {
        adopterProfile = await response.json();
      }
      // 404 is expected if profile doesn't exist yet
    } catch (error) {
      console.error('Failed to fetch adopter profile:', error);
    }
  }

  // Fetch vendor profile if user is vendor
  let vendorProfile: VendorProfile | null = null;
  let vendorPets: Pet[] = [];
  let backendUserId: number | null = null;
  if (user.userType === 'VENDOR') {
    try {
      const profileResponse = await authenticatedFetch(request, '/api/users/me/vendor-profile');
      if (profileResponse.ok) {
        vendorProfile = await profileResponse.json();
      }
      // 404 is expected if profile doesn't exist yet
    } catch (error) {
      console.error('Failed to fetch vendor profile:', error);
    }
    
    try {
      const userResponse = await authenticatedFetch(request, '/api/users/me');
      if (userResponse.ok) {
        const backendUser = await userResponse.json();
        backendUserId = backendUser.id;
        
        const petsResponse = await authenticatedFetch(request, `/api/pets/user/${backendUserId}`);
        if (petsResponse.ok) {
          vendorPets = await petsResponse.json();
        }
      }
    } catch (error) {
      console.error('Failed to fetch vendor pets:', error);
    }
  }

  return { user, token, adopterProfile, vendorProfile, vendorPets, backendUserId };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const formData = await request.formData();
  const intent = formData.get('_intent');

  // Handle vendor profile submission
  if (intent === 'vendor') {
    const organizationName = formData.get('organizationName');
    if (!organizationName || `${organizationName}`.trim() === '') {
      return {
        error: 'Organization name is required',
        vendorErrors: { organizationName: 'Organization name is required' },
      };
    }

    const vendorPayload = {
      organizationName: `${organizationName}`.trim(),
      websiteUrl: formData.get('websiteUrl') || null,
      phoneNumber: formData.get('phoneNumber') || null,
      city: formData.get('city') || null,
      state: formData.get('state') || null,
      description: formData.get('description') || null,
    };

    try {
      const response = await authenticatedFetch(request, '/api/users/me/vendor-profile', {
        method: 'POST',
        body: JSON.stringify(vendorPayload),
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Failed to save profile' }));
        return { error: error.message || 'Failed to save vendor profile' };
      }

      return redirect('/profile');
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'An error occurred' };
    }
  }
  
  // Build adopter profile payload
  const payload = {
    householdSize: formData.get('householdSize') ? parseInt(formData.get('householdSize') as string) : null,
    hasChildren: formData.get('hasChildren') === 'on',
    hasOtherPets: formData.get('hasOtherPets') === 'on',
    homeType: formData.get('homeType') || null,
    yard: formData.get('yard') === 'on',
    fencedYard: formData.get('fencedYard') === 'on',
    preferredSpecies: formData.get('preferredSpecies') || null,
    preferredBreeds: formData.get('preferredBreeds') || null,
    minAge: formData.get('minAge') ? parseInt(formData.get('minAge') as string) : null,
    maxAge: formData.get('maxAge') ? parseInt(formData.get('maxAge') as string) : null,
    additionalNotes: formData.get('additionalNotes') || null,
  };

  try {
    const response = await authenticatedFetch(request, '/api/users/me/adopter-profile', {
      method: 'POST',
      body: JSON.stringify(payload),
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Failed to save profile' }));
      return { error: error.message || 'Failed to save adopter profile' };
    }

    // Success - redirect to reload the page and fetch updated profile
    return redirect('/profile');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

export default function ProfilePage() {
  const { user, token, adopterProfile, vendorProfile, vendorPets, backendUserId } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const revalidator = useRevalidator();
   const navigation = useNavigation();
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const isVendor = user.userType === 'VENDOR';
  const isAdopter = user.userType === 'ADOPTER';
  const vendorProfileLoading = isVendor && (revalidator.state === 'loading' || navigation.state === 'loading');
  const isSubmittingVendor = navigation.state === 'submitting' && navigation.formData?.get('_intent') === 'vendor';

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

      // Revalidate to reload data from loader
      revalidator.revalidate();
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
                    <CardTitle>Vendor Profile Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vendorProfileLoading ? (
                      <div className="space-y-3 animate-pulse">
                        <div className="h-4 w-2/3 rounded bg-muted" />
                        <div className="h-4 w-1/2 rounded bg-muted" />
                        <div className="h-4 w-1/3 rounded bg-muted" />
                        <div className="h-16 w-full rounded bg-muted" />
                      </div>
                    ) : vendorProfile ? (
                      <div className="space-y-3">
                        <div>
                          <p className="text-sm text-muted-foreground">Organization</p>
                          <p className="text-lg font-semibold">{vendorProfile.organizationName}</p>
                        </div>
                        {vendorProfile.websiteUrl && (
                          <div>
                            <p className="text-sm text-muted-foreground">Website</p>
                            <a
                              href={vendorProfile.websiteUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-primary underline"
                            >
                              {vendorProfile.websiteUrl}
                            </a>
                          </div>
                        )}
                        {vendorProfile.phoneNumber && (
                          <div>
                            <p className="text-sm text-muted-foreground">Phone</p>
                            <p className="text-base">{vendorProfile.phoneNumber}</p>
                          </div>
                        )}
                        {(vendorProfile.city || vendorProfile.state) && (
                          <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p className="text-base">{[vendorProfile.city, vendorProfile.state].filter(Boolean).join(', ')}</p>
                          </div>
                        )}
                        {vendorProfile.description && (
                          <div>
                            <p className="text-sm text-muted-foreground">Description</p>
                            <p className="text-base text-muted-foreground">{vendorProfile.description}</p>
                          </div>
                        )}
                        <div className="pt-2">
                          <Button asChild variant="outline">
                            <Link to="/profile#vendor-profile-form">Edit Vendor Profile</Link>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <p className="text-muted-foreground">No vendor profile found.</p>
                        <Button asChild>
                          <Link to="/profile#vendor-profile-form">Create Vendor Profile</Link>
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>My Shelter/Vendor Information</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {actionData?.error && (
                      <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
                        {actionData.error}
                      </div>
                    )}
                    <Form method="post" className="space-y-6" id="vendor-profile-form">
                      <input type="hidden" name="_intent" value="vendor" />
                      
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Organization Name */}
                        <div className="md:col-span-2 space-y-2">
                          <Label htmlFor="organizationName">Organization Name *</Label>
                          <Input
                            id="organizationName"
                            name="organizationName"
                            type="text"
                            required
                            defaultValue={vendorProfile?.organizationName || ''}
                            placeholder="e.g., Happy Paws Shelter"
                            aria-invalid={actionData?.vendorErrors?.organizationName ? true : undefined}
                          />
                          {actionData?.vendorErrors?.organizationName && (
                            <p className="text-sm text-destructive">{actionData.vendorErrors.organizationName}</p>
                          )}
                        </div>

                        {/* Website URL */}
                        <div className="space-y-2">
                          <Label htmlFor="websiteUrl">Website URL</Label>
                          <Input
                            id="websiteUrl"
                            name="websiteUrl"
                            type="url"
                            defaultValue={vendorProfile?.websiteUrl || ''}
                            placeholder="e.g., https://happypaws.org"
                          />
                        </div>

                        {/* Phone Number */}
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber">Phone Number</Label>
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            type="tel"
                            defaultValue={vendorProfile?.phoneNumber || ''}
                            placeholder="e.g., (555) 123-4567"
                          />
                        </div>

                        {/* City */}
                        <div className="space-y-2">
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city"
                            name="city"
                            type="text"
                            defaultValue={vendorProfile?.city || ''}
                            placeholder="e.g., San Francisco"
                          />
                        </div>

                        {/* State */}
                        <div className="space-y-2">
                          <Label htmlFor="state">State</Label>
                          <Input
                            id="state"
                            name="state"
                            type="text"
                            defaultValue={vendorProfile?.state || ''}
                            placeholder="e.g., CA"
                          />
                        </div>
                      </div>

                      {/* Description */}
                      <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <textarea
                          id="description"
                          name="description"
                          defaultValue={vendorProfile?.description || ''}
                          placeholder="Tell us about your organization, mission, and the animals you work with..."
                          rows={4}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <Button type="submit" className="w-full" disabled={isSubmittingVendor}>
                        {isSubmittingVendor ? 'Saving...' : vendorProfile ? 'Update Profile' : 'Create Profile'}
                      </Button>
                    </Form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Your Pet Listings ({vendorPets.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {vendorPets.length === 0 ? (
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
                    <CardTitle>My Adopter Profile</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {actionData?.error && (
                      <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
                        {actionData.error}
                      </div>
                    )}
                    <Form method="post" className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-4">
                        {/* Household Size */}
                        <div className="space-y-2">
                          <Label htmlFor="householdSize">Household Size</Label>
                          <Input
                            id="householdSize"
                            name="householdSize"
                            type="number"
                            min="1"
                            defaultValue={adopterProfile?.householdSize || ''}
                            placeholder="e.g., 3"
                          />
                        </div>

                        {/* Home Type */}
                        <div className="space-y-2">
                          <Label htmlFor="homeType">Home Type</Label>
                          <Input
                            id="homeType"
                            name="homeType"
                            type="text"
                            defaultValue={adopterProfile?.homeType || ''}
                            placeholder="e.g., Apartment, House"
                          />
                        </div>

                        {/* Min Age */}
                        <div className="space-y-2">
                          <Label htmlFor="minAge">Preferred Min Age (years)</Label>
                          <Input
                            id="minAge"
                            name="minAge"
                            type="number"
                            min="0"
                            defaultValue={adopterProfile?.minAge || ''}
                            placeholder="e.g., 1"
                          />
                        </div>

                        {/* Max Age */}
                        <div className="space-y-2">
                          <Label htmlFor="maxAge">Preferred Max Age (years)</Label>
                          <Input
                            id="maxAge"
                            name="maxAge"
                            type="number"
                            min="0"
                            defaultValue={adopterProfile?.maxAge || ''}
                            placeholder="e.g., 10"
                          />
                        </div>

                        {/* Preferred Species */}
                        <div className="space-y-2">
                          <Label htmlFor="preferredSpecies">Preferred Species</Label>
                          <Input
                            id="preferredSpecies"
                            name="preferredSpecies"
                            type="text"
                            defaultValue={adopterProfile?.preferredSpecies || ''}
                            placeholder="e.g., Dog, Cat, Rabbit"
                          />
                        </div>

                        {/* Preferred Breeds */}
                        <div className="space-y-2">
                          <Label htmlFor="preferredBreeds">Preferred Breeds</Label>
                          <Input
                            id="preferredBreeds"
                            name="preferredBreeds"
                            type="text"
                            defaultValue={adopterProfile?.preferredBreeds || ''}
                            placeholder="e.g., Golden Retriever, Labrador"
                          />
                        </div>
                      </div>

                      {/* Checkboxes */}
                      <div className="space-y-3 p-4 border rounded-md">
                        <h3 className="font-semibold text-sm">Household & Home</h3>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="hasChildren"
                            name="hasChildren"
                            defaultChecked={adopterProfile?.hasChildren || false}
                            className="cursor-pointer"
                          />
                          <Label htmlFor="hasChildren" className="cursor-pointer">
                            I have children
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="hasOtherPets"
                            name="hasOtherPets"
                            defaultChecked={adopterProfile?.hasOtherPets || false}
                            className="cursor-pointer"
                          />
                          <Label htmlFor="hasOtherPets" className="cursor-pointer">
                            I have other pets
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="yard"
                            name="yard"
                            defaultChecked={adopterProfile?.yard || false}
                            className="cursor-pointer"
                          />
                          <Label htmlFor="yard" className="cursor-pointer">
                            I have a yard
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id="fencedYard"
                            name="fencedYard"
                            defaultChecked={adopterProfile?.fencedYard || false}
                            className="cursor-pointer"
                          />
                          <Label htmlFor="fencedYard" className="cursor-pointer">
                            My yard is fenced
                          </Label>
                        </div>
                      </div>

                      {/* Additional Notes */}
                      <div className="space-y-2">
                        <Label htmlFor="additionalNotes">Additional Notes</Label>
                        <textarea
                          id="additionalNotes"
                          name="additionalNotes"
                          defaultValue={adopterProfile?.additionalNotes || ''}
                          placeholder="Tell us more about your household and what you're looking for..."
                          rows={4}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>

                      <Button type="submit" className="w-full">
                        {adopterProfile ? 'Update Profile' : 'Create Profile'}
                      </Button>
                    </Form>
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
