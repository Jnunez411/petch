import { useLoaderData, Link, redirect, Form, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/profile.adopter';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { getAdopterProfile, createAdopterProfile, updateAdopterProfile } from '~/services/profile.server';
import type { AdopterProfile, HomeType } from '~/types/adopter';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import {
  Save,
  Loader2,
  ChevronDown
} from 'lucide-react';
import { createLogger } from '~/utils/logger';

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

  return { user, adopterProfile };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const formData = await request.formData();
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
  const { user, adopterProfile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

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

          {/* Sidebar - Account Info Card */}
          <div className="lg:col-span-1">
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
              </div>
            </div>
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
          </div>
        </div>
      </div>
    </div>
  );
}
