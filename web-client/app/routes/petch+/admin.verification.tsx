import { useLoaderData, useFetcher, useSearchParams } from 'react-router';
import type { Route } from './+types/admin.verification';
import { getAuthToken } from '~/services/auth';
import { API_BASE_URL } from '~/config/api-config';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Button } from '~/components/ui/button';

type VerificationRequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface VerificationRequest {
  verificationRequestId: number;
  vendorProfileId: number;
  userId: number;
  organizationName: string;
  contactEmail: string;
  city?: string;
  state?: string;
  submittedAt: string;
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  requestStatus: VerificationRequestStatus;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Vendor Verification - Admin' },
    { name: 'description', content: 'Review vendor verification requests' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const token = await getAuthToken(request);
  const url = new URL(request.url);
  const status = url.searchParams.get('status') || 'PENDING';

  if (!token) {
    return { requests: [], error: 'Not authenticated' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/verification-requests?status=${encodeURIComponent(status)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return { requests: [], error: 'Failed to fetch verification requests' };
    }

    const requests = await response.json();
    return { requests: Array.isArray(requests) ? requests : [], error: null };
  } catch {
    return { requests: [], error: 'API connection failed' };
  }
}

export async function action({ request }: Route.ActionArgs) {
  const token = await getAuthToken(request);
  const formData = await request.formData();
  const verificationRequestId = formData.get('verificationRequestId');
  const status = formData.get('status');
  const rejectionReason = formData.get('rejectionReason');

  if (!token || !verificationRequestId || !status) {
    return { success: false, error: 'Invalid request' };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/admin/verification-requests/${verificationRequestId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status, rejectionReason: rejectionReason || null }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Failed to review request' }));
      return { success: false, error: errorBody.error || 'Failed to review request' };
    }

    return { success: true };
  } catch {
    return { success: false, error: 'API connection failed' };
  }
}

export default function AdminVerificationPage() {
  const { requests, error } = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeStatus = (searchParams.get('status') || 'PENDING') as VerificationRequestStatus;

  const statusLabel: Record<VerificationRequestStatus, string> = {
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
  };

  const setStatusFilter = (status: VerificationRequestStatus) => {
    const next = new URLSearchParams(searchParams);
    if (status === 'PENDING') {
      next.delete('status');
    } else {
      next.set('status', status);
    }
    setSearchParams(next);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Vendor Verification</h1>
        <p className="text-muted-foreground mt-2">
          Review verification requests from shelters and breeders.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <Button
            key={status}
            variant={activeStatus === status ? 'default' : 'outline'}
            size="sm"
            onClick={() => setStatusFilter(status)}
            className={activeStatus === status ? 'bg-coral hover:bg-coral-dark' : ''}
          >
            {statusLabel[status]}
          </Button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive">
          {error}
        </div>
      )}

      {fetcher.data && (fetcher.data as { error?: string }).error && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive">
          {(fetcher.data as { error?: string }).error}
        </div>
      )}

      <Card>
        <CardHeader className="border-b">
          <h2 className="text-lg font-semibold">{statusLabel[activeStatus]} Verification Requests</h2>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left py-3 px-4 font-medium">Organization</th>
                  <th className="text-left py-3 px-4 font-medium">Contact</th>
                  <th className="text-left py-3 px-4 font-medium">Location</th>
                  <th className="text-left py-3 px-4 font-medium">Submitted</th>
                  <th className="text-left py-3 px-4 font-medium">Actions / Review</th>
                </tr>
              </thead>
              <tbody>
                {requests.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">
                      No {statusLabel[activeStatus].toLowerCase()} verification requests.
                    </td>
                  </tr>
                ) : (
                  requests.map((item: VerificationRequest) => (
                    <tr key={item.verificationRequestId} className="border-b hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <p className="font-medium">{item.organizationName}</p>
                        <p className="text-xs text-muted-foreground">Request #{item.verificationRequestId} • Profile #{item.vendorProfileId}</p>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{item.contactEmail}</td>
                      <td className="py-3 px-4 text-muted-foreground">{[item.city, item.state].filter(Boolean).join(', ') || 'N/A'}</td>
                      <td className="py-3 px-4 text-muted-foreground">{new Date(item.submittedAt).toLocaleDateString()}</td>
                      <td className="py-3 px-4">
                        {item.requestStatus === 'PENDING' ? (
                          <div className="flex gap-2">
                            <fetcher.Form method="post">
                              <input type="hidden" name="verificationRequestId" value={item.verificationRequestId} />
                              <input type="hidden" name="status" value="APPROVED" />
                              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={fetcher.state !== 'idle'}>
                                Approve
                              </Button>
                            </fetcher.Form>
                            <fetcher.Form method="post">
                              <input type="hidden" name="verificationRequestId" value={item.verificationRequestId} />
                              <input type="hidden" name="status" value="REJECTED" />
                              <Button size="sm" variant="destructive" disabled={fetcher.state !== 'idle'}>
                                Reject
                              </Button>
                            </fetcher.Form>
                          </div>
                        ) : (
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            {item.reviewedBy && (
                              <p>By <span className="font-medium text-foreground">{item.reviewedBy}</span></p>
                            )}
                            {item.reviewedAt && (
                              <p>{new Date(item.reviewedAt).toLocaleDateString()}</p>
                            )}
                            {item.rejectionReason && (
                              <p className="text-destructive italic">{item.rejectionReason}</p>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
