import { useState, useEffect } from 'react';
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from 'react-router';
import type { Route } from './+types/profile.vendor.adoption-preferences';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import {
  createVendorAdoptionPreferences,
  getVendorAdoptionPreferences,
  getVendorProfile,
  uploadVendorAdoptionPreferencesPdf,
  updateVendorAdoptionPreferences,
  deleteVendorAdoptionPreferencesPdf,
} from '~/services/profile.server';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import type { AdoptionContactMethod, VendorAdoptionPreferencesRequest } from '~/types/vendor';
import { ArrowLeft, CheckCircle2, FileText, Link2, MapPin, Phone, Upload, X } from 'lucide-react';

function getProfileLoadErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      return 'Your login session is out of date. Log out, sign back in, then refresh this page.';
    }
  }

  return 'We could not load your profile right now. Try again later.';
}

function getPreferencesLoadErrorMessage(error: unknown) {
  if (error instanceof Error) {
    if (error.message.includes('401') || error.message.includes('403')) {
      return 'Your session is active in the web app, but tbut failed to load saved preferences. Log out and sign back in, then try again.';
    }
  }

  return 'We could not load your saved adoption preferences right now. You can still update them below.';
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Adoption Preferences - Petch' },
    { name: 'description', content: 'Manage vendor adoption preferences' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  if (!user || !token) {
    return redirect('/login?redirectTo=/profile/vendor/adoption-preferences');
  }

  if (user.userType !== 'VENDOR') {
    return redirect('/profile');
  }

  let vendorProfile = null;
  let preferences = null;
  let loadError: string | null = null;

  try {
    vendorProfile = await getVendorProfile(request);
    if (vendorProfile) {
      try {
        preferences = await getVendorAdoptionPreferences(request);
      } catch (error) {
        loadError = getPreferencesLoadErrorMessage(error);
      }
    }
  } catch (error) {
    loadError = getProfileLoadErrorMessage(error);
  }

  return { vendorProfile, preferences, loadError };
}

export async function action({ request }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  if (!user || !token) {
    return redirect('/login?redirectTo=/profile/vendor/adoption-preferences');
  }

  if (user.userType !== 'VENDOR') {
    return redirect('/profile');
  }

  let vendorProfile;

  try {
    vendorProfile = await getVendorProfile(request);
  } catch (error) {
    return { error: getProfileLoadErrorMessage(error) };
  }

  if (!vendorProfile) {
    return { error: 'Create vendor profile before setting adoption preferences.' };
  }

  const formData = await request.formData();
  const contactMethod = formData.get('contactMethod') as AdoptionContactMethod | null;
  const shouldDeletePresetPdf = formData.get('deletePresetPdf') === 'true';
  const directLinkUrl = (formData.get('directLinkUrl') as string | null)?.trim() || '';
  const contactNumber = (formData.get('contactNumber') as string | null)?.trim() || '';
  const email = (formData.get('email') as string | null)?.trim() || '';
  const phoneNumber = (formData.get('phoneNumber') as string | null)?.trim() || '';
  const stepsDescription = (formData.get('stepsDescription') as string | null)?.trim() || '';
  const onlineFormPdf = formData.get('onlineFormPdf');
  const useShelterLocation = formData.get('useShelterLocation') === 'on';

  if (!contactMethod) {
    return { error: 'Choose a contact method for your listings.' };
  }

  if (contactMethod === 'DIRECT_LINK') {
    if (!directLinkUrl) {
      return { error: 'Add the adoption page URL you want adopters to use.' };
    }

    try {
      new URL(directLinkUrl);
    } catch {
      return { error: 'Enter a valid adoption URL, including https://.' };
    }
  }

  if (contactMethod === 'CONTACT_NUMBER' && !contactNumber) {
    return { error: 'Add the phone number adopters should call or text.' };
  }

  let existingPreferences = null;

  try {
    existingPreferences = await getVendorAdoptionPreferences(request);
  } catch {
    existingPreferences = null;
  }

  const uploadedPdf = onlineFormPdf instanceof File && onlineFormPdf.size > 0 ? onlineFormPdf : null;

  if (contactMethod === 'ONLINE_FORM' && !uploadedPdf && !existingPreferences?.hasOnlineFormPdf) {
    return { error: 'Upload a PDF template so adopters can download and submit it.' };
  }

  const payload: VendorAdoptionPreferencesRequest = {
    useShelterLocation,
    longitude: existingPreferences?.longitude ?? null,
    latitude: existingPreferences?.latitude ?? null,
    contactMethod,
    directLinkUrl: contactMethod === 'DIRECT_LINK' ? directLinkUrl : undefined,
    contactNumber: contactMethod === 'CONTACT_NUMBER' ? contactNumber : undefined,
    stepsDescription: stepsDescription || undefined,
    phoneNumber: contactMethod === 'CONTACT_NUMBER' ? undefined : phoneNumber || undefined,
    email: email || undefined,
    payOnline: existingPreferences?.payOnline ?? false,
  };

  try {
    if (existingPreferences) {
      await updateVendorAdoptionPreferences(request, payload);
    } else {
      await createVendorAdoptionPreferences(request, payload);
    }

    if (contactMethod === 'ONLINE_FORM' && uploadedPdf) {
      await uploadVendorAdoptionPreferencesPdf(request, uploadedPdf);
    } else if (shouldDeletePresetPdf) {
      await deleteVendorAdoptionPreferencesPdf(request);
    }

    return { success: true };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Failed to save adoption preferences.',
    };
  }
}

export default function VendorAdoptionPreferencesPage() {
  const { vendorProfile, preferences, loadError } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  const [useShelterLocation, setUseShelterLocation] = useState(preferences?.useShelterLocation ?? false);

  useEffect(() => {
    if (actionData) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [actionData]);
  const [contactMethod, setContactMethod] = useState<AdoptionContactMethod>(preferences?.contactMethod ?? 'DIRECT_LINK');
  const [pendingDeletePreset, setPendingDeletePreset] = useState(false);
  const hasPreset = !pendingDeletePreset && !!preferences?.hasOnlineFormPdf;

  if (!vendorProfile) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="container mx-auto flex min-h-screen flex-col items-center justify-center px-4 py-10">
          <div className="mb-6 w-full max-w-2xl">
            <Button asChild variant="outline" className="rounded-xl border-coral/30 text-coral hover:bg-coral/10 hover:text-coral-dark">
              <Link to="/profile/vendor">
                <ArrowLeft className="size-4 mr-2" />
                Back to Vendor Profile
              </Link>
            </Button>
          </div>

          <div className="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-8">
            <h1 className="text-2xl font-bold text-foreground">Adoption Preferences</h1>
            <p className="mt-3 text-muted-foreground">
              {loadError || 'Set up your vendor profile first so Petch knows which organization these preferences belong to.'}
            </p>
            <div className="mt-6">
              <Button asChild className="rounded-xl bg-coral hover:bg-coral-dark text-white">
                <Link to="/profile/vendor">Go to Vendor Profile</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="container mx-auto flex flex-col items-center px-4 py-10">
        <div className="mb-6 w-full max-w-4xl">
          <Button asChild variant="outline" className="rounded-xl border-coral/30 text-coral hover:bg-coral/10 hover:text-coral-dark">
            <Link to="/profile/vendor">
              <ArrowLeft className="size-4 mr-2" />
              Back to Vendor Profile
            </Link>
          </Button>
        </div>

        <div className="w-full max-w-4xl space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Adoption Preferences</h1>
            <p className="mt-2 text-muted-foreground max-w-2xl">
              Choose what listing contact details adopters should see and whether your organization location should appear on listings.
            </p>
          </div>

          {loadError && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-700 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
              {loadError}
            </div>
          )}

          {actionData?.success && (
            <div className="rounded-2xl border border-teal/20 bg-teal/10 px-4 py-3 text-teal flex items-center gap-2">
              <CheckCircle2 className="size-5" />
              Adoption preferences saved.
            </div>
          )}

          {actionData?.error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-red-600 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
              {actionData.error}
            </div>
          )}

          <Form method="post" encType="multipart/form-data" className="space-y-6">
            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-coral/10 p-3 text-coral">
                  <MapPin className="size-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground">Location Visibility</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    When enabled, your vendor location from the profile page can be shown on pet listings.
                  </p>

                  <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-2xl border border-zinc-200 dark:border-zinc-700 p-4 hover:border-coral/40 hover:bg-coral/5 transition-colors">
                    <input
                      type="checkbox"
                      name="useShelterLocation"
                      checked={useShelterLocation}
                      onChange={(event) => setUseShelterLocation(event.target.checked)}
                      className="mt-1 h-4 w-4 accent-[var(--color-coral)]"
                    />
                    <div>
                      <p className="font-medium text-foreground">Share my location on listings</p>
                      <p className="text-sm text-muted-foreground">
                        Use the city and state from {vendorProfile.organizationName} on public adoption listings.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-coral/10 p-3 text-coral">
                  <Phone className="size-5" />
                </div>
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-foreground">Contact Method</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose how adopters should reach you from a pet listing.
                  </p>

                  <div className="mt-5 grid gap-4 md:grid-cols-3">
                    <label className={`cursor-pointer rounded-2xl border p-4 transition-colors ${contactMethod === 'DIRECT_LINK' ? 'border-coral bg-coral/5' : 'border-zinc-200 dark:border-zinc-700 hover:border-coral/40'}`}>
                      <input
                        type="radio"
                        name="contactMethod"
                        value="DIRECT_LINK"
                        checked={contactMethod === 'DIRECT_LINK'}
                        onChange={() => setContactMethod('DIRECT_LINK')}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-coral/10 p-2 text-coral">
                          <Link2 className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Direct link</p>
                          <p className="text-sm text-muted-foreground">Send adopters to your external application page.</p>
                        </div>
                      </div>
                    </label>

                    <label className={`cursor-pointer rounded-2xl border p-4 transition-colors ${contactMethod === 'CONTACT_NUMBER' ? 'border-coral bg-coral/5' : 'border-zinc-200 dark:border-zinc-700 hover:border-coral/40'}`}>
                      <input
                        type="radio"
                        name="contactMethod"
                        value="CONTACT_NUMBER"
                        checked={contactMethod === 'CONTACT_NUMBER'}
                        onChange={() => setContactMethod('CONTACT_NUMBER')}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-coral/10 p-2 text-coral">
                          <Phone className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">Contact number</p>
                          <p className="text-sm text-muted-foreground">Let adopters call or text a phone number directly.</p>
                        </div>
                      </div>
                    </label>

                    <label className={`cursor-pointer rounded-2xl border p-4 transition-colors ${contactMethod === 'ONLINE_FORM' ? 'border-coral bg-coral/5' : 'border-zinc-200 dark:border-zinc-700 hover:border-coral/40'}`}>
                      <input
                        type="radio"
                        name="contactMethod"
                        value="ONLINE_FORM"
                        checked={contactMethod === 'ONLINE_FORM'}
                        onChange={() => setContactMethod('ONLINE_FORM')}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-3">
                        <div className="rounded-lg bg-coral/10 p-2 text-coral">
                          <FileText className="size-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">PDF form</p>
                          <p className="text-sm text-muted-foreground">Let adopters download your form, fill it out, and upload it back.</p>
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="mt-6 space-y-4">
                    {contactMethod === 'DIRECT_LINK' && (
                      <div className="space-y-2">
                        <Label htmlFor="directLinkUrl">Adoption page URL</Label>
                        <Input
                          id="directLinkUrl"
                          name="directLinkUrl"
                          type="url"
                          defaultValue={preferences?.directLinkUrl || ''}
                          placeholder="https://your-organization.org/apply"
                          className="rounded-xl"
                        />
                      </div>
                    )}

                    {contactMethod === 'ONLINE_FORM' && (
                      <div className="space-y-3 rounded-2xl border border-dashed border-coral/40 bg-coral/5 p-4">
                        <div className="flex items-start gap-3">
                          <div className="rounded-lg bg-coral/10 p-2 text-coral">
                            <Upload className="size-4" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Upload adoption form PDF</p>
                            <p className="text-sm text-muted-foreground">
                              Upload the PDF template adopters should download, complete, and upload back to you.
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="onlineFormPdf">Template PDF</Label>
                          <Input
                            id="onlineFormPdf"
                            name="onlineFormPdf"
                            type="file"
                            accept="application/pdf,.pdf"
                            className="rounded-xl"
                          />
                        </div>

                        {pendingDeletePreset && (
                          <input type="hidden" name="deletePresetPdf" value="true" />
                        )}

                        {hasPreset && (
                          <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                            <p className="text-sm text-muted-foreground">
                              Current file: <span className="font-medium text-foreground">{preferences!.onlineFormFileName || 'Uploaded PDF'}</span>
                            </p>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-muted-foreground hover:text-destructive"
                              title="Remove preset PDF"
                              onClick={() => setPendingDeletePreset(true)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    )}

                    {contactMethod === 'CONTACT_NUMBER' && (
                      <div className="space-y-2">
                        <Label htmlFor="contactNumber">Listing contact number</Label>
                        <Input
                          id="contactNumber"
                          name="contactNumber"
                          type="tel"
                          defaultValue={preferences?.contactNumber || vendorProfile.phoneNumber || ''}
                          placeholder="(555) 123-4567"
                          className="rounded-xl"
                        />
                      </div>
                    )}

                    <div className={`grid gap-4 ${contactMethod === 'CONTACT_NUMBER' ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>
                      <div className="space-y-2">
                        <Label htmlFor="email">Public email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          defaultValue={preferences?.email || ''}
                          placeholder="adoptions@organization.org"
                          className="rounded-xl"
                        />
                      </div>

                      {contactMethod !== 'CONTACT_NUMBER' && (
                      <div className="space-y-2">
                        <Label htmlFor="phoneNumber">Contact Phone</Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          defaultValue={preferences?.phoneNumber || vendorProfile.phoneNumber || ''}
                          placeholder="(555) 123-4567"
                          className="rounded-xl"
                        />
                      </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="stepsDescription">Adoption steps</Label>
                      <textarea
                        id="stepsDescription"
                        name="stepsDescription"
                        defaultValue={preferences?.stepsDescription || ''}
                        rows={5}
                        placeholder="Briefly explain what an adopter should expect after they reach out."
                        className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-coral/50 resize-none"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button asChild type="button" variant="outline" className="rounded-xl">
                <Link to="/profile/vendor">Cancel</Link>
              </Button>
              <Button type="submit" className="rounded-xl bg-coral hover:bg-coral-dark text-white" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Preferences'}
              </Button>
            </div>
          </Form>
        </div>
      </div>
    </div>
  );
}