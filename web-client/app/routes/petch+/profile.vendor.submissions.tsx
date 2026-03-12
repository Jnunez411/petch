import { Form, Link, redirect, useActionData, useLoaderData, useNavigation } from 'react-router';
import type { Route } from './+types/profile.vendor.submissions';
import { FileText, Download, Trash2, ArrowLeft, Loader2 } from 'lucide-react';
import { getUserFromSession } from '~/services/auth';
import { getSession } from '~/services/session.server';
import { authenticatedFetch } from '~/utils/api';
import type { AdoptionFormSubmission } from '~/types/pet';
import { Button } from '~/components/ui/button';
import { API_BASE_URL } from '~/config/api-config';

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
  return { submissions, token, apiBaseUrl: API_BASE_URL };
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
  const { submissions, token, apiBaseUrl } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();

  const isDeleting = navigation.state === 'submitting';

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