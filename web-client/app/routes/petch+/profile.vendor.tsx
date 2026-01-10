import { useLoaderData, Link, redirect, Form, useActionData, useNavigation, useFetcher } from 'react-router';
import type { Route } from './+types/profile.vendor';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { authenticatedFetch } from '~/utils/api';
import { getVendorProfile, createVendorProfile, updateVendorProfile } from '~/services/profile.server';
import type { VendorProfile } from '~/types/vendor';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle,
  User,
  Camera
} from 'lucide-react';
import { useState, useRef } from 'react';
import { getImageUrl } from '~/config/api-config';
import { PLACEHOLDER_IMAGES } from '~/config/constants';

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
  images?: { filePath: string }[];
  atRisk?: boolean;
  fosterable?: boolean;
  viewCount?: number;
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  if (!user || !token) {
    return redirect('/login?redirectTo=/profile/vendor');
  }

  if (user.userType !== 'VENDOR') {
    return redirect('/profile');
  }

  let vendorProfile: VendorProfile | null = null;
  try {
    vendorProfile = await getVendorProfile(request);
  } catch (error) {
    console.error('Failed to fetch vendor profile:', error);
  }

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

  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const organizationName = formData.get('organizationName') as string;
  const websiteUrl = formData.get('websiteUrl') as string;
  const phoneNumber = formData.get('phoneNumber') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const description = formData.get('description') as string;
  const profileExists = formData.get('profileExists') === 'true';

  const profileData = {
    organizationName,
    websiteUrl: websiteUrl || undefined,
    phoneNumber: phoneNumber || undefined,
    city: city || undefined,
    state: state || undefined,
    description: description || undefined,
  };

  try {
    if (profileExists) {
      await updateVendorProfile(request, profileData);
    } else {
      await createVendorProfile(request, profileData);
    }
    return { success: true, message: 'Profile saved!' };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Failed to save profile' };
  }
}

export default function VendorProfilePage() {
  const { user, vendorProfile, vendorPets } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [isEditing, setIsEditing] = useState(!vendorProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Optimistic preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload to backend
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('/api/v1/vendor/profile/me/image', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Upload failed');
        }

        // Revalidate by reloading the page to get fresh data
        // Alternatively we can just trust the optimistic UI, but better to sync.
        // For now, we just let the optimistic UI hold.
      } catch (error) {
        console.error('Failed to upload image', error);
        alert('Failed to upload profile image.');
      }

      // We should probably revalidate.

    }
  };

  const handleDelete = (petId: number) => {
    if (!confirm('Are you sure you want to delete this pet? This action cannot be undone.')) {
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

  const getPetImageUrl = (pet: Pet) => {
    if (pet.images && pet.images.length > 0) {
      const imageUrl = getImageUrl(pet.images[0].filePath);
      if (imageUrl) return imageUrl;
    }
    return PLACEHOLDER_IMAGES[pet.species] || PLACEHOLDER_IMAGES.default;
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero Section */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center gap-6">
            {/* Avatar */}
            <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
              />
              <div className="size-24 md:size-28 rounded-2xl bg-coral flex items-center justify-center shadow-lg overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:opacity-90 transition-opacity">
                {profileImage || (vendorProfile as any)?.profileImageUrl ? (
                  <img
                    src={profileImage || getImageUrl((vendorProfile as any).profileImageUrl)}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="size-12 md:size-14 text-white" />
                )}

                {/* Hover Overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera className="size-8 text-white" />
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 size-8 rounded-full bg-teal flex items-center justify-center shadow-lg z-10">
                <CheckCircle className="size-5 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="text-center md:text-left flex-1">
              <div className="flex items-center justify-center md:justify-start gap-2 mb-1">
                <span className="px-3 py-1 rounded-full bg-coral/10 text-coral text-xs font-semibold uppercase tracking-wide">
                  Vendor Account
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                {vendorProfile?.organizationName || `${user.firstName} ${user.lastName}`}
              </h1>
              <p className="text-muted-foreground mt-1">{user.email}</p>

              {vendorProfile && (
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-4 text-sm text-muted-foreground">
                  {vendorProfile.city && vendorProfile.state && (
                    <span>{vendorProfile.city}, {vendorProfile.state}</span>
                  )}
                  {vendorProfile.phoneNumber && (
                    <span>{vendorProfile.phoneNumber}</span>
                  )}
                  {vendorProfile.websiteUrl && (
                    <a href={vendorProfile.websiteUrl} target="_blank" rel="noopener noreferrer" className="hover:text-coral transition-colors underline">
                      Website
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="rounded-xl"
                onClick={() => setIsEditing(!isEditing)}
              >
                <Edit3 className="size-4 mr-2" />
                {isEditing ? 'Cancel' : 'Edit Profile'}
              </Button>
              <Button asChild className="rounded-xl bg-coral hover:bg-coral-dark">
                <Link to="/pets/create">
                  <Plus className="size-4 mr-2" />
                  New Listing
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
            <p className="text-3xl font-bold text-foreground">{vendorPets.length}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Listings</p>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
            <p className="text-3xl font-bold text-foreground">{vendorPets.filter(p => p.fosterable).length}</p>
            <p className="text-sm text-muted-foreground mt-1">Fosterable</p>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
            <p className="text-3xl font-bold text-foreground">{vendorPets.filter(p => p.atRisk).length}</p>
            <p className="text-sm text-muted-foreground mt-1">At Risk</p>
          </div>
          <div className="bg-white dark:bg-zinc-800 rounded-2xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-700">
            <p className="text-3xl font-bold text-foreground">{vendorPets.reduce((sum, p) => sum + (p.viewCount || 0), 0)}</p>
            <p className="text-sm text-muted-foreground mt-1">Total Views</p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Form */}
          <div className={`lg:col-span-1 ${isEditing ? 'block' : 'hidden'}`}>
            <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden">
              <div className="p-6 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-xl font-bold">
                  Organization Details
                </h2>
              </div>

              <div className="p-6">
                {actionData?.error && (
                  <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 px-4 py-3 rounded-xl mb-4 text-sm">
                    {actionData.error}
                  </div>
                )}
                {actionData?.success && (
                  <div className="bg-teal/10 border border-teal/20 text-teal px-4 py-3 rounded-xl mb-4 text-sm">
                    Profile saved successfully!
                  </div>
                )}

                <Form method="post" className="space-y-5">
                  <input type="hidden" name="profileExists" value={vendorProfile ? 'true' : 'false'} />

                  <div className="space-y-2">
                    <Label htmlFor="organizationName" className="text-sm font-medium">Organization Name *</Label>
                    <Input
                      id="organizationName"
                      name="organizationName"
                      defaultValue={vendorProfile?.organizationName || ''}
                      placeholder="Happy Paws Shelter"
                      required
                      className="rounded-xl"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="city" className="text-sm font-medium">City</Label>
                      <Input
                        id="city"
                        name="city"
                        defaultValue={vendorProfile?.city || ''}
                        placeholder="San Francisco"
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="state" className="text-sm font-medium">State</Label>
                      <Input
                        id="state"
                        name="state"
                        defaultValue={vendorProfile?.state || ''}
                        placeholder="CA"
                        className="rounded-xl"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phoneNumber" className="text-sm font-medium">Phone Number</Label>
                    <Input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      defaultValue={vendorProfile?.phoneNumber || ''}
                      placeholder="555-123-4567"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl" className="text-sm font-medium">Website</Label>
                    <Input
                      id="websiteUrl"
                      name="websiteUrl"
                      type="url"
                      defaultValue={vendorProfile?.websiteUrl || ''}
                      placeholder="https://happypaws.org"
                      className="rounded-xl"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-medium">About</Label>
                    <textarea
                      id="description"
                      name="description"
                      defaultValue={vendorProfile?.description || ''}
                      placeholder="Tell potential adopters about your organization..."
                      rows={4}
                      className="w-full px-4 py-3 border border-input rounded-xl bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-coral/50 text-sm resize-none"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full rounded-xl bg-coral hover:bg-coral-dark h-12"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : vendorProfile ? 'Save Changes' : 'Create Profile'}
                  </Button>
                </Form>
              </div>
            </div>
          </div>

          {/* Pet Listings */}
          <div className={`${isEditing ? 'lg:col-span-2' : 'lg:col-span-3'}`}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Your Listings</h2>
              {vendorPets.length > 0 && (
                <Button asChild variant="outline" className="rounded-xl">
                  <Link to="/pets/create">
                    <Plus className="size-4 mr-2" />
                    Add Pet
                  </Link>
                </Button>
              )}
            </div>

            {vendorPets.length === 0 ? (
              <div className="bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 p-12 text-center">
                <h3 className="text-xl font-bold mb-2">No Listings Yet</h3>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Start helping pets find their forever homes by creating your first listing.
                </p>
                <Button asChild className="rounded-xl bg-coral hover:bg-coral-dark">
                  <Link to="/pets/create">
                    <Plus className="size-4 mr-2" />
                    Create Your First Listing
                  </Link>
                </Button>
              </div>
            ) : (
              <div className={`grid sm:grid-cols-2 gap-4 ${!isEditing ? 'lg:grid-cols-3 xl:grid-cols-4' : ''}`}>
                {vendorPets.map((pet) => (
                  <div
                    key={pet.id}
                    className="group bg-white dark:bg-zinc-800 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-700 overflow-hidden hover:shadow-lg hover:border-coral/30 transition-all duration-300"
                  >
                    {/* Pet Image */}
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={getPetImageUrl(pet)}
                        alt={pet.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

                      {/* Badges */}
                      <div className="absolute top-3 left-3 flex gap-2">
                        {pet.atRisk && (
                          <span className="px-2 py-1 rounded-full bg-red-500 text-white text-xs font-semibold">
                            At Risk
                          </span>
                        )}
                        {pet.fosterable && (
                          <span className="px-2 py-1 rounded-full bg-teal text-white text-xs font-semibold">
                            Fosterable
                          </span>
                        )}
                      </div>

                      {/* Pet Name */}
                      <div className="absolute bottom-3 left-3 text-white">
                        <h3 className="text-xl font-bold">{pet.name}</h3>
                        <p className="text-sm text-white/80">{pet.breed} • {pet.age} yrs</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-4 flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{pet.species}</span>
                      <div className="flex gap-2">
                        <Button asChild variant="ghost" size="sm" className="rounded-lg">
                          <Link to={`/pets/${pet.id}`}>
                            <ExternalLink className="size-4" />
                          </Link>
                        </Button>
                        <Button asChild variant="ghost" size="sm" className="rounded-lg">
                          <Link to={`/pets/${pet.id}/edit`}>
                            <Edit3 className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20"
                          onClick={() => handleDelete(pet.id)}
                          disabled={isDeletingPet(pet.id)}
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div >
  );
}
