import { useState } from 'react';
import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from 'react-router';
import type { Route } from './+types/profile.vendor.submissions';
import { FileText, Download, Trash2, ArrowLeft, Loader2, CheckCircle, MapPin, Clock, CreditCard, X, CalendarCheck, ChevronDown } from 'lucide-react';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { authenticatedFetch } from '~/utils/api';
import { getVendorProfile } from '~/services/profile.server';
import type { AdoptionFormSubmission, AdoptionAppointment } from '~/types/pet';
import type { VendorProfileResponse } from '~/types/vendor';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { API_BASE_URL } from '~/config/api-config';

type AppointmentType = 'PICKUP' | 'MEETUP';
type PaymentOption = 'IN_PERSON' | 'ONLINE' | 'BOTH';

interface AppointmentFormData {
  type: AppointmentType;
  locationStreet: string;
  locationCity: string;
  locationState: string;
  locationZip: string;
  date: string;
  timeSlots: string[];
  paymentOption: PaymentOption;
  additionalInfo: string;
}

const DEFAULT_FORM: AppointmentFormData = {
  type: 'PICKUP',
  locationStreet: '',
  locationCity: '',
  locationState: '',
  locationZip: '',
  date: '',
  timeSlots: [],
  paymentOption: 'BOTH',
  additionalInfo: '',
};

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Vendor Submission Forms - Petch' },
    { name: 'description', content: 'Review and manage submission forms for your pet listings.' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');

  if (!user) {
    return redirect('/login?redirectTo=/profile/vendor/submissions');
  }

  if (user.userType !== 'VENDOR') {
    return redirect('/profile');
  }

  const submissionsResponse = await authenticatedFetch(request, '/api/v1/vendor/submissions/me');
  if (!submissionsResponse.ok) {
    throw new Response('Failed to load submissions', { status: submissionsResponse.status });
  }

  const submissions: AdoptionFormSubmission[] = await submissionsResponse.json();

  let vendorProfile: VendorProfileResponse | null = null;
  try {
    vendorProfile = await getVendorProfile(request);
  } catch {
    vendorProfile = null;
  }

  let pendingAppointments: AdoptionAppointment[] = [];
  try {
    const apptResponse = await authenticatedFetch(request, '/api/v1/vendor/appointments/me');
    if (apptResponse.ok) {
      const all: AdoptionAppointment[] = await apptResponse.json();
      // "Sent out" = waiting for adopter to select a time
      pendingAppointments = all.filter(a => !a.selectedTime);
    }
  } catch {
    pendingAppointments = [];
  }

  return { submissions, vendorProfile, pendingAppointments, token, apiBaseUrl: API_BASE_URL };
}

export async function action({ request }: Route.ActionArgs) {
  const user = await getUserFromSession(request);

  if (!user) {
    return redirect('/login?redirectTo=/profile/vendor/submissions');
  }

  if (user.userType !== 'VENDOR') {
    return redirect('/profile');
  }

  const formData = await request.formData();
  const intent = formData.get('intent');
  const submissionId = formData.get('submissionId');

  if (intent !== 'delete-submission' || !submissionId) {
    return { error: 'Invalid request.' };
  }

  const response = await authenticatedFetch(request, `/api/v1/vendor/submissions/me/${submissionId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    return { error: 'Failed to delete submission.' };
  }

  return { success: 'Submission deleted successfully.' };
}

export default function VendorSubmissionsPage() {
  const { submissions, vendorProfile, pendingAppointments, token, apiBaseUrl } = useLoaderData<typeof loader>();

  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isDeleting = navigation.state === 'submitting';

  // Pending (sent-out) appointments state
  const [localPending, setLocalPending] = useState(pendingAppointments);
  const [expandedPending, setExpandedPending] = useState<number | null>(
    pendingAppointments.length > 0 ? pendingAppointments[0].id : null
  );
  const [cancelLoading, setCancelLoading] = useState<Record<number, boolean>>({});

  const handleCancelPending = async (appointmentId: number) => {
    setCancelLoading(p => ({ ...p, [appointmentId]: true }));
    try {
      const res = await fetch(`${apiBaseUrl}/api/v1/vendor/appointments/${appointmentId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setLocalPending(prev => prev.filter(a => a.id !== appointmentId));
    } finally {
      setCancelLoading(p => ({ ...p, [appointmentId]: false }));
    }
  };

  // Confirm modal state
  const [confirmSubmission, setConfirmSubmission] = useState<AdoptionFormSubmission | null>(null);
  // Appointment form modal state
  const [appointmentSubmission, setAppointmentSubmission] = useState<AdoptionFormSubmission | null>(null);
  const [appointmentForm, setAppointmentForm] = useState<AppointmentFormData>(DEFAULT_FORM);
  const [appointmentSent, setAppointmentSent] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [appointmentLoading, setAppointmentLoading] = useState(false);
  const [timeHour, setTimeHour] = useState('12');
  const [timeMinute, setTimeMinute] = useState('00');
  const [timeAmPm, setTimeAmPm] = useState<'AM' | 'PM'>('AM');

  const formatTime = (t: string) => {
    if (!t) return t;
    const [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, '0')} ${ampm}`;
  };

  // Build a 24h "HH:MM" string from the three parts for storage
  const buildTimeValue = (hour: string, minute: string, ampm: 'AM' | 'PM') => {
    let h = parseInt(hour, 10);
    if (ampm === 'AM') { h = h === 12 ? 0 : h; }
    else { h = h === 12 ? 12 : h + 12; }
    return `${h.toString().padStart(2, '0')}:${minute}`;
  };

  const todayStr = new Date().toISOString().split('T')[0];

  const addTimeSlot = () => {
    const value = buildTimeValue(timeHour, timeMinute, timeAmPm);
    if (!appointmentForm.timeSlots.includes(value)) {
      setAppointmentForm(f => ({ ...f, timeSlots: [...f.timeSlots, value] }));
    }
  };

  const removeTimeSlot = (slot: string) => {
    setAppointmentForm(f => ({ ...f, timeSlots: f.timeSlots.filter(s => s !== slot) }));
  };

  const openConfirm = (submission: AdoptionFormSubmission) => {
    setConfirmSubmission(submission);
  };

  const handleConfirmAccept = () => {
    setAppointmentSubmission(confirmSubmission);
    setAppointmentForm({
      ...DEFAULT_FORM,
      locationCity: vendorProfile?.city || '',
      locationState: vendorProfile?.state || '',
    });
    setTimeHour('12');
    setTimeMinute('00');
    setTimeAmPm('AM');
    setAppointmentSent(false);
    setAppointmentError(null);
    setConfirmSubmission(null);
  };

  const handleAppointmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appointmentSubmission || !token) return;

    if (!appointmentForm.locationStreet.trim() || !appointmentForm.locationCity.trim() ||
        !appointmentForm.locationState.trim() || !appointmentForm.locationZip.trim()) {
      setAppointmentError('Please enter a complete address including street, city, state, and ZIP.');
      return;
    }
    if (!appointmentForm.date) {
      setAppointmentError('Please select a date.');
      return;
    }
    if (appointmentForm.date <= todayStr) {
      setAppointmentError('Please select a future date.');
      return;
    }
    if (appointmentForm.timeSlots.length === 0) {
      setAppointmentError('Please add at least one available time slot.');
      return;
    }

    setAppointmentLoading(true);
    setAppointmentError(null);

    try {
      // Send appointment details via email to the adopter
      const fullAddress = [
        appointmentForm.locationStreet,
        appointmentForm.locationCity,
        appointmentForm.locationState,
        appointmentForm.locationZip,
      ].filter(Boolean).join(', ');

      const payload = {
        submissionId: appointmentSubmission.id,
        petName: appointmentSubmission.petName || `Pet #${appointmentSubmission.petId}`,
        adopterEmail: appointmentSubmission.adopterEmail,
        adopterName: appointmentSubmission.adopterName,
        appointmentType: appointmentForm.type,
        location: fullAddress,
        date: appointmentForm.date,
        times: appointmentForm.timeSlots.map(formatTime).join(', '),
        paymentOption: appointmentForm.paymentOption,
        additionalInfo: appointmentForm.additionalInfo,
      };

      const response = await fetch(`${apiBaseUrl}/api/v1/vendor/submissions/${appointmentSubmission.id}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to send appointment details.');
      }

      setAppointmentSent(true);
    } catch {
      setAppointmentError('Something went wrong. Please try again.');
    } finally {
      setAppointmentLoading(false);
    }
  };

  const handleDownloadSubmission = async (submission: AdoptionFormSubmission) => {
    if (!token) {
      return;
    }

    const response = await fetch(`${apiBaseUrl}/api/pets/${submission.petId}/adoption-form-submissions/${submission.id}/download`, {
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

      {/* ── Sent-Out Appointments (awaiting adopter response) ── */}
      {localPending.length > 0 && (
        <div className="bg-blue-50/60 border-b border-blue-200/60">
          <div className="container mx-auto px-4 py-6 max-w-6xl space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <CalendarCheck className="size-5 text-blue-600" />
              <h2 className="text-base font-bold text-blue-700">
                {localPending.length} appointment{localPending.length > 1 ? 's' : ''} sent out — awaiting adopter response
              </h2>
            </div>

            {localPending.map((appt) => {
              const isExpanded = expandedPending === appt.id;
              return (
                <div key={appt.id} className="rounded-2xl border border-blue-200 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-5 py-4 text-left"
                    onClick={() => setExpandedPending(isExpanded ? null : appt.id)}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="size-5 text-blue-500 shrink-0" />
                      <div>
                        <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                          {appt.petName ?? `Pet #${appt.petId}`}
                          <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-medium ${
                            appt.appointmentType === 'PICKUP' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
                          }`}>
                            {appt.appointmentType === 'PICKUP' ? 'Pick Up' : 'Meet Up'}
                          </span>
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Adopter: {appt.adopterEmail} · Waiting for adopter to select a time
                        </p>
                      </div>
                    </div>
                    <ChevronDown className={`size-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4 space-y-3">
                      <div className="grid sm:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-start gap-2">
                          <MapPin className="size-4 text-zinc-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Location</p>
                            <p className="text-zinc-700 dark:text-zinc-300">{appt.location}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CalendarCheck className="size-4 text-zinc-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Date</p>
                            <p className="text-zinc-700 dark:text-zinc-300">
                              {new Date(appt.appointmentDate).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock className="size-4 text-zinc-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Available Times</p>
                            <p className="text-zinc-700 dark:text-zinc-300">{appt.availableTimes}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CreditCard className="size-4 text-zinc-400 mt-0.5 shrink-0" />
                          <div>
                            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Payment</p>
                            <p className="text-zinc-700 dark:text-zinc-300">
                              {appt.paymentOption === 'IN_PERSON' ? 'In Person' : appt.paymentOption === 'ONLINE' ? 'Online' : 'In Person or Online'}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                        <Button
                          type="button"
                          variant="outline"
                          disabled={cancelLoading[appt.id]}
                          onClick={() => handleCancelPending(appt.id)}
                          className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 w-full sm:w-auto"
                        >
                          {cancelLoading[appt.id] ? <Loader2 className="size-4 mr-2 animate-spin" /> : <X className="size-4 mr-2" />}
                          Cancel Appointment
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Confirm "Are you sure?" Modal ── */}
      {confirmSubmission && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="size-6 text-teal shrink-0" />
                <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Accept this submission?</h2>
              </div>
              <button onClick={() => setConfirmSubmission(null)} className="text-zinc-400 hover:text-zinc-600">
                <X className="size-5" />
              </button>
            </div>
            <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">
              You're about to accept the submission from{' '}
              <span className="font-semibold">{confirmSubmission.adopterName || confirmSubmission.adopterEmail}</span>{' '}
              for <span className="font-semibold">{confirmSubmission.petName || `Pet #${confirmSubmission.petId}`}</span>.
            </p>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              You'll fill out appointment details on the next step.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setConfirmSubmission(null)}>
                Cancel
              </Button>
              <Button className="rounded-xl bg-teal text-white hover:bg-teal/90" onClick={handleConfirmAccept}>
                Yes, proceed
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Appointment Form Modal ── */}
      {appointmentSubmission && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50">
          <div className="flex min-h-full items-start justify-center p-4 pt-8">
            <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl dark:bg-zinc-900 mb-8">
              <div className="flex items-start justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 p-6">
                <div className="flex items-center gap-3">
                  <CalendarCheck className="size-6 text-teal shrink-0" />
                  <div>
                    <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Adoption Appointment</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                      For {appointmentSubmission.petName || `Pet #${appointmentSubmission.petId}`} · {appointmentSubmission.adopterName || appointmentSubmission.adopterEmail}
                    </p>
                  </div>
                </div>
                {!appointmentSent && (
                  <button onClick={() => setAppointmentSubmission(null)} className="text-zinc-400 hover:text-zinc-600 mt-1">
                    <X className="size-5" />
                  </button>
                )}
              </div>

            {appointmentSent ? (
              <div className="flex flex-col items-center gap-4 p-10 text-center">
                <CheckCircle className="size-12 text-teal" />
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">Appointment details sent!</h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  The adopter has been notified at <span className="font-medium">{appointmentSubmission.adopterEmail}</span>.
                </p>
                <Button className="mt-2 rounded-xl bg-teal text-white hover:bg-teal/90" onClick={() => setAppointmentSubmission(null)}>
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleAppointmentSubmit} className="p-6 space-y-5">

                {/* Appointment Type */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Appointment Type</Label>
                  <div className="flex gap-3">
                    {(['PICKUP', 'MEETUP'] as AppointmentType[]).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setAppointmentForm(f => ({ ...f, type: t }))}
                        className={`flex-1 rounded-xl border-2 py-2.5 text-sm font-semibold transition-colors ${
                          appointmentForm.type === t
                            ? 'border-teal bg-teal/10 text-teal'
                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
                        }`}
                      >
                        {t === 'PICKUP' ? 'Pick Up During Business Hours' : 'Meet Up Appointment'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    <MapPin className="size-4" /> Full Address
                  </Label>
                  <Input
                    placeholder="Street address"
                    value={appointmentForm.locationStreet}
                    onChange={e => setAppointmentForm(f => ({ ...f, locationStreet: e.target.value }))}
                    className="rounded-xl"
                  />
                  <div className="grid grid-cols-5 gap-2">
                    <Input
                      placeholder="City"
                      value={appointmentForm.locationCity}
                      onChange={e => setAppointmentForm(f => ({ ...f, locationCity: e.target.value }))}
                      className="rounded-xl col-span-2"
                    />
                    <Input
                      placeholder="State"
                      value={appointmentForm.locationState}
                      onChange={e => setAppointmentForm(f => ({ ...f, locationState: e.target.value }))}
                      className="rounded-xl col-span-2"
                    />
                    <Input
                      placeholder="ZIP"
                      value={appointmentForm.locationZip}
                      onChange={e => setAppointmentForm(f => ({ ...f, locationZip: e.target.value }))}
                      className="rounded-xl col-span-1"
                    />
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1.5">
                  <Label htmlFor="appt-date" className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    <CalendarCheck className="size-4" /> Date
                  </Label>
                  <Input
                    id="appt-date"
                    type="date"
                    min={(() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })()}
                    value={appointmentForm.date}
                    onChange={e => setAppointmentForm(f => ({ ...f, date: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>

                {/* Time Slots */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    <Clock className="size-4" /> Available Time Slots
                  </Label>
                  <div className="flex gap-2 items-center flex-wrap">
                    {/* Hour */}
                    <select
                      value={timeHour}
                      onChange={e => setTimeHour(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    >
                      {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                        <option key={h} value={String(h)}>{h}</option>
                      ))}
                    </select>
                    <span className="text-zinc-500 font-semibold">:</span>
                    {/* Minute */}
                    <select
                      value={timeMinute}
                      onChange={e => setTimeMinute(e.target.value)}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    >
                      {Array.from({ length: 6 }, (_, i) => i * 10).map(m => (
                        <option key={m} value={m.toString().padStart(2, '0')}>{m.toString().padStart(2, '0')}</option>
                      ))}
                    </select>
                    {/* AM / PM */}
                    <select
                      value={timeAmPm}
                      onChange={e => setTimeAmPm(e.target.value as 'AM' | 'PM')}
                      className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-teal dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                    >
                      <option value="AM">AM</option>
                      <option value="PM">PM</option>
                    </select>
                    <Button
                      type="button"
                      onClick={addTimeSlot}
                      className="rounded-xl bg-teal text-white hover:bg-teal/90 px-4"
                    >
                      Add
                    </Button>
                  </div>
                  {appointmentForm.timeSlots.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {appointmentForm.timeSlots.map(slot => (
                        <span key={slot} className="inline-flex items-center gap-1.5 rounded-full bg-teal/10 px-3 py-1 text-sm font-medium text-teal">
                          {formatTime(slot)}
                          <button type="button" onClick={() => removeTimeSlot(slot)} className="hover:text-teal/70">
                            <X className="size-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Payment Options */}
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    <CreditCard className="size-4" /> Payment Options
                  </Label>
                  {appointmentSubmission?.priceEstimate != null && appointmentSubmission.priceEstimate > 0 && (
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                      Listed adoption fee: <span className="font-semibold text-zinc-900 dark:text-zinc-50">${appointmentSubmission.priceEstimate.toFixed(2)}</span>
                    </p>
                  )}
                  <div className="flex gap-3">
                    {([
                      { value: 'IN_PERSON', label: 'In Person' },
                      { value: 'ONLINE', label: 'Online' },
                      { value: 'BOTH', label: 'Both' },
                    ] as { value: PaymentOption; label: string }[]).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setAppointmentForm(f => ({ ...f, paymentOption: opt.value }))}
                        className={`flex-1 rounded-xl border-2 py-2 text-sm font-semibold transition-colors ${
                          appointmentForm.paymentOption === opt.value
                            ? 'border-teal bg-teal/10 text-teal'
                            : 'border-zinc-200 text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-400'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="space-y-1.5">
                  <Label htmlFor="appt-info" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                    Additional Info <span className="font-normal text-zinc-400">(optional)</span>
                  </Label>
                  <textarea
                    id="appt-info"
                    rows={3}
                    placeholder="Any other details for the adopter, e.g. bring a carrier, ID required, parking info..."
                    value={appointmentForm.additionalInfo}
                    onChange={e => setAppointmentForm(f => ({ ...f, additionalInfo: e.target.value }))}
                    className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                </div>

                {appointmentError && (
                  <p className="text-sm text-red-600 dark:text-red-400">{appointmentError}</p>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => setAppointmentSubmission(null)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={appointmentLoading} className="rounded-xl bg-teal text-white hover:bg-teal/90">
                    {appointmentLoading && <Loader2 className="size-4 mr-2 animate-spin" />}
                    Send Appointment Details
                  </Button>
                </div>
              </form>
            )}
            </div>
          </div>
        </div>
      )}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          <Link to="/profile/vendor" className="inline-flex items-center gap-2 text-sm font-medium text-coral hover:text-coral-dark">
            <ArrowLeft className="size-4" />
            Back to Vendor Profile
          </Link>
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50">Submission Forms</h1>
              <p className="mt-2 text-zinc-500 dark:text-zinc-400">
                Review who submitted, which pet they submitted for, and remove forms you no longer need.
              </p>
            </div>
            <div className="rounded-2xl bg-teal/10 px-4 py-3 text-right text-teal">
              <p className="text-2xl font-bold">{submissions.length}</p>
              <p className="text-sm font-medium">Total submissions</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        {actionData?.error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/20 dark:text-red-400">
            {actionData.error}
          </div>
        )}
        {actionData?.success && (
          <div className="mb-6 rounded-xl border border-teal/20 bg-teal/10 px-4 py-3 text-sm text-teal">
            {actionData.success}
          </div>
        )}

        {submissions.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <FileText className="mx-auto size-10 text-teal" />
            <h2 className="mt-4 text-xl font-bold text-zinc-900 dark:text-zinc-50">No submission forms yet</h2>
            <p className="mt-2 text-zinc-500 dark:text-zinc-400">
              Once people upload completed PDFs for your listings, they will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {submissions.map((submission) => (
              <div
                key={submission.id}
                className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:flex-row md:items-center md:justify-between"
              >
                <div className="space-y-1">
                  <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                    {submission.petName || `Pet #${submission.petId}`}
                  </p>
                  <p className="text-sm text-zinc-600 dark:text-zinc-300">
                    Submitted by {submission.adopterName || submission.adopterEmail}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">{submission.adopterEmail}</p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">File: {submission.fileName}</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Uploaded {new Date(submission.createdAt).toLocaleString()}
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button
                    type="button"
                    className="rounded-xl bg-teal text-white hover:bg-teal/90"
                    onClick={() => openConfirm(submission)}
                  >
                    <CheckCircle className="size-4 mr-2" />
                    Accept &amp; Proceed
                  </Button>

                  <Button type="button" variant="outline" className="rounded-xl" onClick={() => handleDownloadSubmission(submission)}>
                    <Download className="size-4 mr-2" />
                    Download
                  </Button>

                  <Form method="post">
                    <input type="hidden" name="intent" value="delete-submission" />
                    <input type="hidden" name="submissionId" value={submission.id} />
                    <Button type="submit" variant="destructive" className="rounded-xl" disabled={isDeleting}>
                      {isDeleting ? <Loader2 className="size-4 mr-2 animate-spin" /> : <Trash2 className="size-4 mr-2" />}
                      Delete
                    </Button>
                  </Form>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}