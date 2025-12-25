import { useLoaderData, Link, redirect, Form, useActionData, useNavigation, useFetcher } from 'react-router';
import type { Route } from './+types/profile.vendor';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { authenticatedFetch } from '~/utils/api';
import { getVendorProfile, createVendorProfile, updateVendorProfile } from '~/services/profile.server';
import type { VendorProfile } from '~/types/vendor';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Vendor Profile - Petch' },
    { name: 'description', content: 'Manage your vendor profile and pet listings' },
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
    return redirect('/login?redirectTo=/profile/vendor');
  }

  // Redirect if not a vendor
  if (user.userType !== 'VENDOR') {
    return redirect('/profile');
  }

  // Fetch vendor profile
  let vendorProfile: VendorProfile | null = null;
  try {
    vendorProfile = await getVendorProfile(request);
  } catch (error) {
    console.error('Failed to fetch vendor profile:', error);
  }

  // Fetch vendor pets
  let vendorPets: Pet[] = [];
  let backendUserId: number | null = null;
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

  return { user, vendorProfile, vendorPets, backendUserId };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  // Handle delete pet action
  if (intent === 'delete-pet') {
    const petId = formData.get('petId');
    if (!petId) {
      return { error: 'Pet ID is required' };
    }

    try {
      const response = await authenticatedFetch(request, `/api/pets/${petId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete pet: ${response.status}`);
      }

      return { success: true, message: 'Pet deleted successfully' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete pet' };
    }
  }

  // Handle update/create vendor profile action
  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const organizationName = formData.get('organizationName');

  if (!organizationName || `${organizationName}`.trim() === '') {
    return {
      error: 'Organization name is required',
      vendorErrors: { organizationName: 'Organization name is required' },
    };
  }

  const websiteUrl = formData.get('websiteUrl');
  const phoneNumber = formData.get('phoneNumber');
  const city = formData.get('city');
  const state = formData.get('state');
  const description = formData.get('description');

  const vendorPayload = {
    organizationName: `${organizationName}`.trim(),
    websiteUrl: websiteUrl ? String(websiteUrl) : undefined,
    phoneNumber: phoneNumber ? String(phoneNumber) : undefined,
    city: city ? String(city) : undefined,
    state: state ? String(state) : undefined,
    description: description ? String(description) : undefined,
  };

  try {
    const profileExists = formData.get('profileExists') === 'true';

    if (profileExists) {
      await updateVendorProfile(request, vendorPayload);
    } else {
      await createVendorProfile(request, vendorPayload);
    }

    return redirect('/profile/vendor');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

export default function VendorProfilePage() {
  const { user, vendorProfile, vendorPets } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const handleDelete = (petId: number) => {
    if (!confirm('Are you sure you want to delete this pet?')) {
      return;
    }

    fetcher.submit(
      { intent: 'delete-pet', petId: petId.toString() },
      { method: 'POST' }
    );
  };

  const isDeletingPet = (petId: number) => {
    return (
      fetcher.state !== 'idle' &&
      fetcher.formData?.get('intent') === 'delete-pet' &&
      fetcher.formData?.get('petId') === petId.toString()
    );
  };

  return (
    <div className="min-h-screen bg-background">
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
                  <p className="text-lg font-medium">Vendor</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Vendor Profile Form */}
            <Card>
              <CardHeader>
                <CardTitle>My Profile</CardTitle>
              </CardHeader>
              <CardContent>
                {actionData?.error && (
                  <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded mb-4">
                    {actionData.error}
                  </div>
                )}
                <Form method="post" className="space-y-6" id="vendor-profile-form">
                  <input type="hidden" name="profileExists" value={vendorProfile ? 'true' : 'false'} />

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
                        inputMode="numeric"
                        pattern="^\d*$"
                        defaultValue={vendorProfile?.phoneNumber || ''}
                        placeholder="e.g., 5551234567"
                        onInput={(e) => {
                          e.currentTarget.value = e.currentTarget.value.replace(/[^0-9]/g, '');
                        }}
                      />
                      <p className="text-xs text-muted-foreground">
                        Digits only. No letters, symbols, or spaces allowed.
                      </p>
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

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : vendorProfile ? 'Update Profile' : 'Create Profile'}
                  </Button>
                </Form>
              </CardContent>
            </Card>

            {/* Pet Listings */}
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Your Pet Listings ({vendorPets.length})</CardTitle>
                  {vendorPets.length > 0 && (
                    <Button asChild>
                      <Link to="/pets/create">Create Listing</Link>
                    </Button>
                  )}
                </div>
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
                              disabled={isDeletingPet(pet.id)}
                            >
                              {isDeletingPet(pet.id) ? 'Deleting...' : 'Delete'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
