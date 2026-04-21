import { useLoaderData, Link, redirect, Form, useActionData, useNavigation, useFetcher } from 'react-router';
import type { Route } from './+types/profile.vendor';
import { getUserFromSession, logout } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { authenticatedFetch } from '~/utils/api';
import { getVendorProfile, createVendorProfile, updateVendorProfile } from '~/services/profile.server';
import type { VendorProfile } from '~/types/vendor';

import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ChangePasswordSection } from '~/components/blocks/ChangePasswordSection';
import {
  Building2,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  CheckCircle,
  User,
  Camera,
  AlertCircle,
  SlidersHorizontal,
  FileText
} from 'lucide-react';
import { useState, useRef } from 'react';
import { getImageUrl } from '~/config/api-config';
import { PLACEHOLDER_IMAGES } from '~/config/constants';
import { createLogger } from '~/utils/logger';

const logger = createLogger('VendorProfile');

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
  isAdopted?: boolean;
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
    logger.error('Failed to fetch vendor profile', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  let vendorPets: Pet[] = [];
  let backendUserId: number | null = null;
  let submissionCount = 0;
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
    logger.error('Failed to fetch vendor pets', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  try {
    const submissionsResponse = await authenticatedFetch(request, '/api/v1/vendor/submissions/me');
    if (submissionsResponse.ok) {
      const submissions = await submissionsResponse.json();
      submissionCount = Array.isArray(submissions) ? submissions.length : 0;
    }
  } catch (error) {
    logger.error('Failed to fetch vendor submission count', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  return { user, vendorProfile, vendorPets, backendUserId, submissionCount };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'upload-image') {
    const session = await getSession(request.headers.get('Cookie'));
    const token = session.get('token');
    if (!token) {
      return { error: 'Not authenticated' };
    }

    const file = formData.get('file') as File;
    if (!file) {
      return { error: 'No file provided' };
    }

    try {
      const uploadForm = new FormData();
      uploadForm.append('file', file);

      const { API_BASE_URL } = await import('~/config/api-config');
      const response = await fetch(`${API_BASE_URL}/api/v1/vendor/profile/me/image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: uploadForm,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }

      return { success: true, message: 'Profile image updated!' };
    } catch (error) {
      logger.error('Failed to upload profile image', { error: error instanceof Error ? error.message : 'Unknown error' });
      return { error: error instanceof Error ? error.message : 'Failed to upload profile image' };
    }
  }

  if (intent === 'delete-account') {
    try {
      const response = await authenticatedFetch(request, '/api/users/me', {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`Failed to delete account: ${response.status}`);
      }

      return await logout(request);
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to delete account' };
    }
  }

  if (intent === 'change-password') {
    const currentPassword = formData.get('currentPassword') as string;
    const newPassword = formData.get('newPassword') as string;

    try {
      const response = await authenticatedFetch(request, '/api/users/me/password', {
        method: 'PUT',
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();
      if (!response.ok) {
        return { error: data.message || 'Failed to change password' };
      }
      return { success: true };
    } catch (error) {
      if (error instanceof Response) {
        return { error: 'Your session has expired. Please log in again.' };
      }
      return { error: error instanceof Error ? error.message : 'Failed to change password' };
    }
  }

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

  if (intent === 'toggle-adopted') {
    const petId = formData.get('petId');
    const isAdopted = formData.get('isAdopted') === 'true';
    if (!petId) {
      return { error: 'Pet ID is required' };
    }

    try {
      const response = await authenticatedFetch(request, `/api/pets/${petId}/adoption-status`, {
        method: 'PUT',
        body: JSON.stringify({ isAdopted }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update adoption status: ${response.status}`);
      }

      return { success: true };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update adoption status' };
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
  const audioRef = useRef<HTMLAudioElement>(null);
  const { user, vendorProfile, vendorPets, submissionCount } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const fetcher = useFetcher();
  const deleteFetcher = useFetcher();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [isEditing, setIsEditing] = useState(!vendorProfile);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Optimistic preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Upload via server action (so the auth token is attached)
      const formData = new FormData();
      formData.append('intent', 'upload-image');
      formData.append('file', file);
      fetcher.submit(formData, {
        method: 'POST',
        encType: 'multipart/form-data',
      });
    }
  };

  const isDeletingAccount = deleteFetcher.state !== 'idle';

  const handleDeleteAccount = () => {
    setShowDeleteAccountModal(true);
  };

  const confirmDeleteAccount = () => {
    deleteFetcher.submit(
      { intent: 'delete-account' },
      { method: 'POST' }
    );
    setShowDeleteAccountModal(false);
  };

  const adoptFetcher = useFetcher();

  const isTogglingAdoption = (petId: number) => {
    return (
      adoptFetcher.state !== 'idle' &&
      adoptFetcher.formData?.get('intent') === 'toggle-adopted' &&
      adoptFetcher.formData?.get('petId') === petId.toString()
    );
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ id: number } | null>(null);
  const handleDelete = (petId: number) => {
    setDeleteConfirm({ id: petId });
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
      {/* Custom Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <audio ref={audioRef} src="/chime2.mp3" preload="auto" />
          <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-lg shadow-lg p-8 max-w-md w-full flex flex-col items-center">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Confirm Delete</h2>
            <p className="mb-6 text-center text-muted-foreground">
              Are you sure you want to delete this pet? This action cannot be undone.
            </p>
            <div className="flex gap-4 w-full justify-center">
              <Button variant="outline" className="flex-1" onClick={() => setDeleteConfirm(null)}>
                Cancel
              </Button>
              <Button variant="destructive" className="flex-1" onClick={() => {
                if (audioRef.current) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play();
                  setTimeout(() => {
                    fetcher.submit(
                      { intent: 'delete-pet', petId: deleteConfirm.id.toString() },
                      { method: 'POST' }
                    );
                    setDeleteConfirm(null);
                  }, 250);
                } else {
                  fetcher.submit(
                    { intent: 'delete-pet', petId: deleteConfirm.id.toString() },
                    { method: 'POST' }
                  );
                  setDeleteConfirm(null);
                }
              }}>
                Confirm
              </Button>
            </div>
          </div>
        </div>
      )}
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
              <Button asChild variant="outline" className="rounded-xl border-coral/30 text-coral hover:bg-coral/10 hover:text-coral-dark">
                <Link to="/profile/vendor/adoption-preferences">
                  <SlidersHorizontal className="size-4 mr-2" />
                  Adoption Preferences
                </Link>
              </Button>
              <Button asChild variant="outline" className="rounded-xl border-teal/30 text-teal hover:bg-teal/10 hover:text-teal">
                <Link to="/profile/vendor/submissions" className="inline-flex items-center gap-2">
                  <FileText className="size-4" />
                  Submission Forms
                  <span className="inline-flex min-w-6 items-center justify-center rounded-full bg-teal px-2 py-0.5 text-xs font-semibold text-white">
                    {submissionCount}
                  </span>
                </Link>
              </Button>
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

            {/* Change Password & Account Status */}
            <div className="mt-6 space-y-6">
              <ChangePasswordSection />
              
              {/* Dangerous Area */}
              <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-red-100 dark:border-red-900/30 overflow-hidden">
                <div className="bg-red-50/50 dark:bg-red-950/10 px-6 py-4 border-b border-red-100 dark:border-red-900/30">
                  <h3 className="text-sm font-semibold text-red-800 dark:text-red-300">Account Status</h3>
                </div>
                <div className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">Disable Account</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Taking a break? Disable your account temporarily. You can reactivate it anytime.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-xl border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-400 dark:hover:border-red-600 hover:text-red-700 dark:hover:text-red-300"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                  >
                    <Trash2 className="size-4 mr-2" />
                    {isDeletingAccount ? 'Disabling...' : 'Disable Account'}
                  </Button>
                </div>
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
                        {pet.isAdopted && (
                          <span className="px-2 py-1 rounded-full bg-purple-500 text-white text-xs font-semibold">
                            Adopted
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
                          <Link to={`/pets/${pet.id}?origin=profile`}>
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
                          className={`rounded-lg ${pet.isAdopted ? 'text-purple-500 hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-950/20' : 'text-muted-foreground hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-950/20'}`}
                          title={pet.isAdopted ? 'Mark as Available' : 'Mark as Adopted'}
                          onClick={() => adoptFetcher.submit(
                            { intent: 'toggle-adopted', petId: pet.id.toString(), isAdopted: (!pet.isAdopted).toString() },
                            { method: 'POST' }
                          )}
                          disabled={isTogglingAdoption(pet.id)}
                        >
                          <CheckCircle className="size-4" />
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
      {/* Disable Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 mb-4 text-red-600">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <AlertCircle className="size-6" />
              </div>
              <h3 className="text-xl font-bold">Disable Account?</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Are you sure you want to disable your vendor account? Your pet listings will be hidden from public view until you reactivate your account.
            </p>
            <div className="flex gap-3 justify-end">
              <Button 
                variant="outline" 
                className="rounded-xl flex-1 h-11"
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={isDeletingAccount}
              >
                Cancel
              </Button>
              <Button 
                variant="destructive" 
                className="rounded-xl flex-1 h-11 bg-red-600 hover:bg-red-700"
                onClick={confirmDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? 'Disabling...' : 'Disable Account'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
