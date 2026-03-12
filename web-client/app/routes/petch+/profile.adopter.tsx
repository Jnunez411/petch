import { useLoaderData, Link, redirect, Form, useActionData, useNavigation, useFetcher } from 'react-router';
import type { Route } from './+types/profile.adopter';
import { getUserFromSession, logout } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { authenticatedFetch } from '~/utils/api';
import { getAdopterProfile, createAdopterProfile, updateAdopterProfile } from '~/services/profile.server';
import type { AdopterProfile, HomeType } from '~/types/adopter';
import type { AdoptionFormSubmission } from '~/types/pet';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { ChangePasswordSection } from '~/components/blocks/ChangePasswordSection';
import {
  Save,
  Loader2,
  ChevronDown,
  Download,
  FileText
  Trash2
} from 'lucide-react';
import { useState } from 'react';
import { createLogger } from '~/utils/logger';
import { API_BASE_URL } from '~/config/api-config';

const logger = createLogger('AdopterProfile');

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Adopter Profile - Petch' },
    { name: 'description', content: 'Manage your adopter profile and preferences' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  // Redirect to login if not authenticated
  if (!user || !token) {
    return redirect('/login?redirectTo=/profile/adopter');
  }

  // Redirect if not an adopter
  if (user.userType !== 'ADOPTER') {
    return redirect('/profile');
  }

  // Fetch adopter profile
  let adopterProfile: AdopterProfile | null = null;
  try {
    adopterProfile = await getAdopterProfile(request);
  } catch (error) {
    logger.error('Failed to fetch adopter profile', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  let submissions: AdoptionFormSubmission[] = [];
  try {
    const response = await fetch(`${API_BASE_URL}/api/v1/adopter/submissions/me`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (response.ok) {
      submissions = await response.json();
    }
  } catch (error) {
    logger.error('Failed to fetch adopter submissions', { error: error instanceof Error ? error.message : 'Unknown error' });
  }

  return { user, adopterProfile, submissions, token };
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const intent = formData.get('intent');

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

  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const homeTypeValue = formData.get('homeType');
  const additionalNotesValue = formData.get('additionalNotes');

  const payload = {
    householdSize: formData.get('householdSize') ? parseInt(formData.get('householdSize') as string) : undefined,
    hasChildren: formData.get('hasChildren') === 'on',
    hasOtherPets: formData.get('hasOtherPets') === 'on',
    homeType: homeTypeValue ? (homeTypeValue as HomeType) : undefined,
    yard: formData.get('yard') === 'on',
    fencedYard: formData.get('fencedYard') === 'on',
    additionalNotes: additionalNotesValue ? String(additionalNotesValue) : undefined,
  };

  try {
    const profileExists = formData.get('profileExists') === 'true';

    if (profileExists) {
      await updateAdopterProfile(request, payload);
    } else {
      await createAdopterProfile(request, payload);
    }

    return redirect('/profile/adopter');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

// Custom Toggle Component
function ToggleCheckbox({
  id,
  name,
  checked,
  label,
  accentColor = 'coral'
}: {
  id: string;
  name: string;
  checked: boolean;
  label: string;
  accentColor?: 'coral' | 'teal';
}) {
  const colorClasses = {
    coral: 'peer-checked:bg-coral peer-checked:border-coral',
    teal: 'peer-checked:bg-teal peer-checked:border-teal'
  };

  return (
    <label
      htmlFor={id}
      className="group flex items-center gap-4 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 cursor-pointer hover:border-zinc-300 dark:hover:border-zinc-600 hover:shadow-md transition-all duration-200"
    >
      <input
        type="checkbox"
        id={id}
        name={name}
        defaultChecked={checked}
        className="peer sr-only"
      />
      <div className={`relative flex items-center justify-center w-12 h-7 rounded-full bg-zinc-200 dark:bg-zinc-700 border-2 border-zinc-300 dark:border-zinc-600 transition-all duration-300 ${colorClasses[accentColor]} peer-checked:[&_div]:translate-x-5`}>
        <div className="absolute left-1 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300" />
      </div>
      <span className="font-medium text-zinc-700 dark:text-zinc-200">{label}</span>
    </label>
  );
}

export default function AdopterProfilePage() {
  const { user, adopterProfile, submissions, token } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const deleteFetcher = useFetcher();

  const isSubmitting = navigation.state === 'submitting';
  const isDeleting = deleteFetcher.state !== 'idle';
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);

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

  const handleDownloadSubmission = async (submission: AdoptionFormSubmission) => {
    if (!token) {
      return;
    }

    const response = await fetch(`${API_BASE_URL}/api/v1/adopter/submissions/me/${submission.id}/download`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return;
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = submission.fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Page Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">My Profile</h1>
            <p className="text-zinc-500 dark:text-zinc-400">Manage your adopter preferences</p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Sidebar - Account Info & Change Password */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              {/* Card Header with Accent */}
              <div className="bg-coral/5 dark:bg-coral/10 px-6 py-5 border-b border-coral/10">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Account Info
                </h2>
              </div>

              <div className="p-6 space-y-5">
                {/* Name */}
                <div>
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Name</p>
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {user.firstName} {user.lastName}
                  </p>
                </div>

                {/* Email */}
                <div>
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Email</p>
                  <p className="text-base text-zinc-700 dark:text-zinc-300">{user.email}</p>
                </div>

                {/* Account Type */}
                <div>
                  <p className="text-xs font-medium text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Account Type</p>
                  <span className="inline-flex items-center px-3 py-1 mt-1 rounded-full text-sm font-medium bg-teal/10 text-teal">
                    Adopter
                  </span>
                </div>

                {/* Delete Account */}
                <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
                  <Button
                    variant="outline"
                    className="w-full rounded-xl border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/20 hover:border-red-300 dark:hover:border-red-700"
                    onClick={handleDeleteAccount}
                    disabled={isDeleting}
                  >
                    <Trash2 className="size-4 mr-2" />
                    {isDeleting ? 'Deleting...' : 'Delete Account'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <ChangePasswordSection />
          </div>

          {/* Main Form Card */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
              {/* Card Header */}
              <div className="bg-zinc-50 dark:bg-zinc-800/50 px-6 py-5 border-b border-zinc-200 dark:border-zinc-700">
                <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  Household Information
                </h2>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Help us match you with the perfect pet</p>
              </div>

              <div className="p-6">
                {actionData?.error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-6 flex items-center gap-3">
                    <div className="p-1.5 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <span className="text-red-500">!</span>
                    </div>
                    {actionData.error}
                  </div>
                )}

                <Form method="post" className="space-y-8">
                  <input type="hidden" name="profileExists" value={adopterProfile ? 'true' : 'false'} />

                  {/* Basic Info Grid */}
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Household Size */}
                    <div className="space-y-2">
                      <Label htmlFor="householdSize" className="text-zinc-700 dark:text-zinc-300">
                        Household Size
                      </Label>
                      <Input
                        id="householdSize"
                        name="householdSize"
                        type="number"
                        min="1"
                        defaultValue={adopterProfile?.householdSize || ''}
                        placeholder="e.g., 3"
                        className="h-12 rounded-xl border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 focus:ring-2 focus:ring-coral/30 focus:border-coral transition-all"
                      />
                    </div>

                    {/* Home Type */}
                    <div className="space-y-2">
                      <Label htmlFor="homeType" className="text-zinc-700 dark:text-zinc-300">
                        Home Type
                      </Label>
                      <div className="relative">
                        <select
                          id="homeType"
                          name="homeType"
                          defaultValue={adopterProfile?.homeType ?? ''}
                          className="w-full h-12 px-4 pr-10 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 focus:ring-2 focus:ring-coral/30 focus:border-coral transition-all appearance-none cursor-pointer"
                        >
                          <option value="">Select home type</option>
                          <option value="APARTMENT">Apartment</option>
                          <option value="HOUSE">House</option>
                          <option value="CONDO">Condo</option>
                          <option value="TOWNHOUSE">Townhouse</option>
                          <option value="OTHER">Other</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 size-5 text-zinc-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Toggle Options Section */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                      <span className="text-sm font-medium text-zinc-500 dark:text-zinc-400 px-3">Household Details</span>
                      <div className="h-px flex-1 bg-zinc-200 dark:bg-zinc-700" />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <ToggleCheckbox
                        id="hasChildren"
                        name="hasChildren"
                        checked={adopterProfile?.hasChildren || false}
                        label="I have children"
                        accentColor="coral"
                      />
                      <ToggleCheckbox
                        id="hasOtherPets"
                        name="hasOtherPets"
                        checked={adopterProfile?.hasOtherPets || false}
                        label="I have other pets"
                        accentColor="coral"
                      />
                      <ToggleCheckbox
                        id="yard"
                        name="yard"
                        checked={adopterProfile?.yard || false}
                        label="I have a yard"
                        accentColor="coral"
                      />
                      <ToggleCheckbox
                        id="fencedYard"
                        name="fencedYard"
                        checked={adopterProfile?.fencedYard || false}
                        label="My yard is fenced"
                        accentColor="coral"
                      />
                    </div>
                  </div>

                  {/* Additional Notes */}
                  <div className="space-y-3">
                    <Label htmlFor="additionalNotes" className="text-zinc-700 dark:text-zinc-300">
                      Additional Notes
                    </Label>
                    <textarea
                      id="additionalNotes"
                      name="additionalNotes"
                      defaultValue={adopterProfile?.additionalNotes || ''}
                      placeholder="Tell us more about your household and what you're looking for in a pet..."
                      rows={4}
                      className="w-full px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-coral/30 focus:border-coral transition-all resize-none"
                    />
                  </div>

                  {/* Submit Button */}
                  <Button
                    type="submit"
                    className="w-full h-14 rounded-xl text-base font-semibold bg-coral hover:bg-coral-dark shadow-lg shadow-coral/20 hover:shadow-xl hover:shadow-coral/30 transition-all duration-300 hover:-translate-y-0.5"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="size-5 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="size-5 mr-2" />
                        {adopterProfile ? 'Update Profile' : 'Create Profile'}
                      </>
                    )}
                  </Button>
                </Form>
              </div>
            </div>

            <div className="mt-8 bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
              <div className="bg-zinc-50 dark:bg-zinc-800/50 px-6 py-5 border-b border-zinc-200 dark:border-zinc-700 flex items-center gap-3">
                <FileText className="size-5 text-coral" />
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">Submitted Adoption Forms</h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">Download the PDF forms you have already submitted.</p>
                </div>
              </div>

              <div className="p-6">
                {submissions.length === 0 ? (
                  <p className="text-zinc-500 dark:text-zinc-400">You have not uploaded any adoption forms yet.</p>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => (
                      <div
                        key={submission.id}
                        className="flex flex-col gap-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 p-4 md:flex-row md:items-center md:justify-between"
                      >
                        <div>
                          <p className="font-semibold text-zinc-900 dark:text-zinc-50">{submission.petName || `Pet #${submission.petId}`}</p>
                          <p className="text-sm text-zinc-500 dark:text-zinc-400">{submission.fileName}</p>
                          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
                            Submitted {new Date(submission.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => handleDownloadSubmission(submission)}
                        >
                          <Download className="size-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Account Modal */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Account</h3>
            <p className="text-muted-foreground mb-4">
              Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => setShowDeleteAccountModal(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmDeleteAccount}>
                Delete Account
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
