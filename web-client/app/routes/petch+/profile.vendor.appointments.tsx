import { useState } from 'react';
import { Link, redirect, useLoaderData } from 'react-router';
import type { Route } from './+types/profile.vendor.appointments';
import {
  ArrowLeft, CalendarCheck, CheckCircle, Clock, CreditCard, ChevronDown,
  FileText, Loader2, MapPin, X,
} from 'lucide-react';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { authenticatedFetch } from '~/utils/api';
import type { AdoptionAppointment } from '~/types/pet';
import { Button } from '~/components/ui/button';
import { API_BASE_URL } from '~/config/api-config';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Appointments - Petch' },
    { name: 'description', content: 'Manage your adoption appointments.' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const user = await getUserFromSession(request);
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');

  if (!user || !token) return redirect('/login?redirectTo=/profile/vendor/appointments');
  if (user.userType !== 'VENDOR') return redirect('/profile');

  let appointments: AdoptionAppointment[] = [];
  try {
    const res = await authenticatedFetch(request, '/api/v1/vendor/appointments/me');
    if (res.ok) appointments = await res.json();
  } catch { /* silent */ }

  return { appointments, token };
}

export default function VendorAppointmentsPage() {
  const { appointments, token } = useLoaderData<typeof loader>();

  // Split into pending (not yet vendor-confirmed) and upcoming (confirmed)
  const [pendingAppts, setPendingAppts] = useState(
    appointments.filter(a => !a.vendorConfirmed)
  );
  const [upcomingAppts, setUpcomingAppts] = useState(
    appointments.filter(a => !!a.vendorConfirmed)
  );

  const [expandedPending, setExpandedPending] = useState<number | null>(
    pendingAppts.length > 0 ? pendingAppts[0].id : null
  );
  const [expandedUpcoming, setExpandedUpcoming] = useState<number | null>(
    upcomingAppts.length > 0 ? upcomingAppts[0].id : null
  );

  // acceptedIds = vendor clicked "Accept New Pet"
  const [acceptedIds, setAcceptedIds] = useState<Set<number>>(
    new Set(pendingAppts.filter(a => !!a.selectedTime).map(a => a.id))
  );
  const [confirmedIds, setConfirmedIds] = useState<Set<number>>(new Set());
  const [selectedTimes, setSelectedTimes] = useState<Record<number, string>>(
    Object.fromEntries(appointments.filter(a => a.selectedTime).map(a => [a.id, a.selectedTime!]))
  );

  const [confirmLoading, setConfirmLoading] = useState<Record<number, boolean>>({});
  const [timeSelectLoading, setTimeSelectLoading] = useState<Record<number, boolean>>({});
  const [cancelLoading, setCancelLoading] = useState<Record<number, boolean>>({});
  const [dismissingId, setDismissingId] = useState<number | null>(null);
  const [dismissLoading, setDismissLoading] = useState(false);

  const handleVendorSelectTime = async (appointmentId: number, time: string) => {
    setTimeSelectLoading(p => ({ ...p, [appointmentId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/vendor/appointments/${appointmentId}/select-time`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedTime: time }),
      });
      if (res.ok) {
        setSelectedTimes(p => ({ ...p, [appointmentId]: time }));
        setConfirmedIds(p => new Set([...p, appointmentId]));
        // Move from pending → upcoming
        const appt = pendingAppts.find(a => a.id === appointmentId);
        if (appt) {
          setPendingAppts(prev => prev.filter(a => a.id !== appointmentId));
          setUpcomingAppts(prev => [{ ...appt, selectedTime: time, vendorConfirmed: true }, ...prev]);
          setExpandedUpcoming(appointmentId);
        }
      }
    } finally {
      setTimeSelectLoading(p => ({ ...p, [appointmentId]: false }));
    }
  };

  const handleConfirm = async (appointmentId: number) => {
    setConfirmLoading(p => ({ ...p, [appointmentId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/vendor/appointments/${appointmentId}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setConfirmedIds(p => new Set([...p, appointmentId]));
        const appt = pendingAppts.find(a => a.id === appointmentId);
        if (appt) {
          setPendingAppts(prev => prev.filter(a => a.id !== appointmentId));
          setUpcomingAppts(prev => [{ ...appt, vendorConfirmed: true }, ...prev]);
          setExpandedUpcoming(appointmentId);
        }
      }
    } finally {
      setConfirmLoading(p => ({ ...p, [appointmentId]: false }));
    }
  };

  const handleCancel = async (appointmentId: number) => {
    setCancelLoading(p => ({ ...p, [appointmentId]: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/vendor/appointments/${appointmentId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) setPendingAppts(prev => prev.filter(a => a.id !== appointmentId));
    } finally {
      setCancelLoading(p => ({ ...p, [appointmentId]: false }));
    }
  };

  const handleDismiss = async () => {
    if (!dismissingId) return;
    setDismissLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/vendor/appointments/${dismissingId}/cancel`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        setUpcomingAppts(prev => prev.filter(a => a.id !== dismissingId));
        setDismissingId(null);
      }
    } finally {
      setDismissLoading(false);
    }
  };

  const detailGrid = (appt: AdoptionAppointment) => (
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
        <CreditCard className="size-4 text-zinc-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Payment</p>
          <p className="text-zinc-700 dark:text-zinc-300">
            {appt.paymentOption === 'IN_PERSON' ? 'In Person' : appt.paymentOption === 'ONLINE' ? 'Online' : 'In Person or Online'}
          </p>
        </div>
      </div>
      {appt.additionalInfo && (
        <div className="flex items-start gap-2 sm:col-span-2">
          <FileText className="size-4 text-zinc-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-zinc-400 font-medium uppercase tracking-wide">Notes</p>
            <p className="text-zinc-700 dark:text-zinc-300">{appt.additionalInfo}</p>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <div className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
        <div className="container mx-auto px-4 py-6 max-w-5xl flex items-center gap-4">
          <Button asChild variant="outline" className="rounded-xl">
            <Link to="/profile/vendor">
              <ArrowLeft className="size-4 mr-2" />
              Back
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Appointments</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {pendingAppts.length} pending · {upcomingAppts.length} upcoming
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-5xl space-y-10">

        {/* ── Pending Requests ── */}
        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
            <Clock className="size-5 text-amber-500" />
            Pending Requests
            {pendingAppts.length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-2 py-0.5 font-semibold">{pendingAppts.length}</span>
            )}
          </h2>

          {pendingAppts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-10 text-center">
              <CalendarCheck className="size-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No pending requests right now.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingAppts.map((appt) => {
                const isExpanded = expandedPending === appt.id;
                const isAccepted = acceptedIds.has(appt.id);
                const adopterSelected = !!appt.selectedTime;
                const times = appt.availableTimes?.split(',').map(t => t.trim()).filter(Boolean) ?? [];

                return (
                  <div key={appt.id} className="rounded-2xl border border-amber-200/60 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                      onClick={() => setExpandedPending(isExpanded ? null : appt.id)}
                    >
                      <div className="flex items-center gap-3">
                        {adopterSelected || isAccepted
                          ? <CalendarCheck className="size-5 text-amber-500 shrink-0" />
                          : <Clock className="size-5 text-zinc-400 shrink-0" />}
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
                            {adopterSelected ? 'Action required · Adopter selected a time'
                              : isAccepted ? 'Choose a time slot'
                              : 'New adoption request'}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`size-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4 space-y-4">
                        {detailGrid(appt)}

                        {!isAccepted ? (
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 rounded-xl bg-zinc-50 border border-zinc-200 dark:bg-zinc-800/50 dark:border-zinc-700 px-4 py-3">
                              <Clock className="size-4 text-zinc-400 shrink-0" />
                              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                A new adoption request has arrived for <span className="font-semibold">{appt.petName}</span>. Accept the new pet?
                              </p>
                            </div>
                            <div className="flex gap-3 flex-wrap">
                              <Button
                                onClick={() => setAcceptedIds(p => new Set([...p, appt.id]))}
                                className="rounded-xl bg-teal text-white hover:bg-teal/90"
                              >
                                <CheckCircle className="size-4 mr-2" />
                                Accept New Pet
                              </Button>
                              <Button
                                type="button"
                                variant="outline"
                                disabled={cancelLoading[appt.id]}
                                onClick={() => handleCancel(appt.id)}
                                className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                              >
                                {cancelLoading[appt.id] ? <Loader2 className="size-4 mr-2 animate-spin" /> : <X className="size-4 mr-2" />}
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : adopterSelected ? (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 rounded-xl bg-amber-50 border border-amber-200 px-4 py-3 dark:bg-amber-950/20 dark:border-amber-800">
                              <CheckCircle className="size-4 text-amber-600 shrink-0" />
                              <p className="text-sm font-medium text-amber-700 dark:text-amber-400">
                                Adopter selected: <span className="font-bold">{appt.selectedTime}</span> · Please confirm this works for you
                              </p>
                            </div>
                            <Button
                              onClick={() => handleConfirm(appt.id)}
                              disabled={confirmLoading[appt.id]}
                              className="rounded-xl bg-teal text-white hover:bg-teal/90 w-full sm:w-auto"
                            >
                              {confirmLoading[appt.id] ? <Loader2 className="size-4 mr-2 animate-spin" /> : <CheckCircle className="size-4 mr-2" />}
                              Confirm Appointment
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
                              <Clock className="size-4" />
                              {appt.appointmentType === 'MEETUP' ? 'Pick a time for the adopter' : 'Choose a pick-up time for the adopter'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {times.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  disabled={timeSelectLoading[appt.id]}
                                  onClick={() => handleVendorSelectTime(appt.id, t)}
                                  className="px-3 py-1.5 rounded-xl border-2 border-teal/30 text-sm font-medium text-teal hover:bg-teal/10 hover:border-teal transition-colors disabled:opacity-50"
                                >
                                  {timeSelectLoading[appt.id] ? <Loader2 className="size-3 animate-spin inline" /> : t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* ── Upcoming Appointments ── */}
        <section>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-4 flex items-center gap-2">
            <CheckCircle className="size-5 text-teal" />
            Upcoming Appointments
            {upcomingAppts.length > 0 && (
              <span className="text-xs bg-teal/10 text-teal rounded-full px-2 py-0.5 font-semibold">{upcomingAppts.length}</span>
            )}
          </h2>

          {upcomingAppts.length === 0 ? (
            <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-6 py-10 text-center">
              <CheckCircle className="size-8 text-zinc-300 mx-auto mb-2" />
              <p className="text-sm text-zinc-500">No confirmed appointments yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingAppts.map((appt) => {
                const isExpanded = expandedUpcoming === appt.id;
                const chosenTime = selectedTimes[appt.id] ?? appt.selectedTime;

                return (
                  <div key={appt.id} className="rounded-2xl border border-teal/20 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                      onClick={() => setExpandedUpcoming(isExpanded ? null : appt.id)}
                    >
                      <div className="flex items-center gap-3">
                        <CheckCircle className="size-5 text-teal shrink-0" />
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
                            Appointment set{chosenTime ? ` · ${chosenTime}` : ''}
                          </p>
                        </div>
                      </div>
                      <ChevronDown className={`size-4 text-zinc-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </button>

                    {isExpanded && (
                      <div className="border-t border-zinc-100 dark:border-zinc-800 px-5 py-4 space-y-4">
                        {detailGrid(appt)}

                        <div className="flex items-center gap-2 rounded-xl bg-teal/10 border border-teal/20 px-4 py-3">
                          <CheckCircle className="size-4 text-teal shrink-0" />
                          <p className="text-sm font-medium text-teal">Appointment is set{chosenTime ? ` · ${chosenTime}` : ''}</p>
                        </div>

                        {(appt.paymentOption === 'ONLINE' || appt.paymentOption === 'BOTH') && (
                          <div>
                            <Button className="rounded-xl bg-teal text-white hover:bg-teal/90 w-full sm:w-auto">
                              <CreditCard className="size-4 mr-2" />
                              Pay Online
                            </Button>
                            <p className="text-xs text-zinc-400 mt-1">Luis Stripe part goes here.</p>
                          </div>
                        )}

                        <div className="pt-1 border-t border-zinc-100 dark:border-zinc-800">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setDismissingId(appt.id)}
                            className="rounded-xl border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 w-full sm:w-auto"
                          >
                            <X className="size-4 mr-2" />
                            Dismiss
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>

      {/* Dismiss confirmation modal */}
      {dismissingId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-zinc-900 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 mb-2">Dismiss appointment?</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-5">
              This will permanently delete the appointment record. This cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" className="rounded-xl" onClick={() => setDismissingId(null)} disabled={dismissLoading}>
                Keep it
              </Button>
              <Button
                className="rounded-xl bg-red-600 text-white hover:bg-red-700"
                onClick={handleDismiss}
                disabled={dismissLoading}
              >
                {dismissLoading ? <Loader2 className="size-4 mr-2 animate-spin" /> : null}
                Yes, dismiss
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
