import { useLoaderData, Link, redirect, Form, useActionData, useNavigation } from 'react-router';
import type { Route } from './+types/profile.adopter';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { getAdopterProfile, createAdopterProfile, updateAdopterProfile } from '~/services/profile.server';
import type { AdopterProfile, HomeType } from '~/types/adopter';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';

export function meta({}: Route.MetaArgs) {
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
    console.error('Failed to fetch adopter profile:', error);
  }

  return { user, adopterProfile };
}

export async function action({ request }: Route.ActionArgs) {
  if (request.method !== 'POST') {
    return { error: 'Method not allowed' };
  }

  const formData = await request.formData();
  const homeTypeValue = formData.get('homeType');

  const payload = {
    householdSize: formData.get('householdSize') ? parseInt(formData.get('householdSize') as string) : undefined,
    hasChildren: formData.get('hasChildren') === 'on',
    hasOtherPets: formData.get('hasOtherPets') === 'on',
    homeType: homeTypeValue ? (homeTypeValue as HomeType) : undefined,
    yard: formData.get('yard') === 'on',
    fencedYard: formData.get('fencedYard') === 'on',
    additionalNotes: formData.get('additionalNotes') || undefined,
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

export default function AdopterProfilePage() {
  const { user, adopterProfile } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isSubmitting = navigation.state === 'submitting';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Adopter Profile</h1>
            <Button asChild variant="outline">
              <Link to="/pets">ê Back to Pets</Link>
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
                  <p className="text-lg font-medium">=d Adopter</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
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
                  <input type="hidden" name="profileExists" value={adopterProfile ? 'true' : 'false'} />
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
                      <select
                        id="homeType"
                        name="homeType"
                        defaultValue={adopterProfile?.homeType ?? ''}
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-foreground"
                      >
                        <option value="">Select home type</option>
                        <option value="APARTMENT">Apartment</option>
                        <option value="HOUSE">House</option>
                        <option value="CONDO">Condo</option>
                        <option value="TOWNHOUSE">Townhouse</option>
                        <option value="OTHER">Other</option>
                      </select>
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

                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : adopterProfile ? 'Update Profile' : 'Create Profile'}
                  </Button>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
