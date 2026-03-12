import { useState } from 'react';
import { useLoaderData, useFetcher, Link } from 'react-router';
import type { Route } from './+types/admin.reports';
import { getAuthToken } from '~/services/auth';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Button } from '~/components/ui/button';
import { API_BASE_URL } from '~/config/api-config';
import { REPORT_REASON_LABELS, REPORT_STATUS_LABELS } from '~/types/report';
import type { ReportDTO, ReportReason, ReportStatus } from '~/types/report';
import { Flag, Eye, XCircle, AlertTriangle } from 'lucide-react';

export function meta({ }: Route.MetaArgs) {
    return [
        { title: 'Reports - Admin' },
        { name: 'description', content: 'Review and manage user reports' },
    ];
}

export async function loader({ request }: Route.LoaderArgs) {
    const token = await getAuthToken(request);

    if (!token) {
        return { reports: [], error: 'Not authenticated' };
    }

    try {
        const response = await fetch(`${API_BASE_URL}/api/admin/reports?page=0&size=1000`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return { reports: [], error: 'Failed to fetch reports' };
        }

        const data = await response.json();
        const reports = data.content || [];
        return { reports, error: null };
    } catch (error) {
        return { reports: [], error: 'API connection failed' };
    }
}

export async function action({ request }: Route.ActionArgs) {
    const token = await getAuthToken(request);
    const formData = await request.formData();
    const reportId = formData.get('reportId');
    const actionType = formData.get('_action');

    if (!token || !reportId) {
        return { success: false, error: 'Invalid request' };
    }

    if (actionType === 'resolve') {
        const status = formData.get('status') as string;
        const adminNotes = formData.get('adminNotes') as string;

        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/reports/${reportId}/resolve`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ status, adminNotes: adminNotes || null }),
            });

            if (!response.ok) {
                return { success: false, error: 'Failed to resolve report' };
            }

            return { success: true };
        } catch {
            return { success: false, error: 'API connection failed' };
        }
    }

    if (actionType === 'deletePet') {
        const petId = formData.get('petId');
        try {
            const response = await fetch(`${API_BASE_URL}/api/admin/pets/${petId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (!response.ok) {
                return { success: false, error: 'Failed to delete pet' };
            }

            return { success: true, deleted: true };
        } catch {
            return { success: false, error: 'API connection failed' };
        }
    }

    return { success: false, error: 'Unknown action' };
}

const ITEMS_PER_PAGE = 10;

const STATUS_COLORS: Record<ReportStatus, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    REVIEWED: 'bg-blue-100 text-blue-700',
    PARDONED: 'bg-zinc-100 text-zinc-600',
    BANNED: 'bg-red-100 text-red-700',
};

export default function AdminReports() {
    const { reports, error } = useLoaderData<typeof loader>();
    const fetcher = useFetcher();
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [resolveModal, setResolveModal] = useState<ReportDTO | null>(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [resolveStatus, setResolveStatus] = useState<string>('PARDONED');
    const [deleteConfirm, setDeleteConfirm] = useState<{ reportId: number; petId: number; petName: string } | null>(null);

    if (error) {
        return (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 text-destructive">
                {error}
            </div>
        );
    }

    // Filter reports
    const filteredReports = reports.filter((report: ReportDTO) => {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
            report.petName?.toLowerCase().includes(query) ||
            report.reporterEmail?.toLowerCase().includes(query) ||
            report.reporterName?.toLowerCase().includes(query) ||
            report.reasons?.some((r: string) =>
                REPORT_REASON_LABELS[r as ReportReason]?.toLowerCase().includes(query)
            );
        const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    // Pagination
    const totalPages = Math.ceil(filteredReports.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedReports = filteredReports.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Counts
    const pendingCount = reports.filter((r: ReportDTO) => r.status === 'PENDING').length;
    const reviewedCount = reports.filter((r: ReportDTO) => r.status === 'REVIEWED').length;
    const pardonedCount = reports.filter((r: ReportDTO) => r.status === 'PARDONED').length;
    const bannedCount = reports.filter((r: ReportDTO) => r.status === 'BANNED').length;

    const handleResolveSubmit = () => {
        if (!resolveModal) return;
        fetcher.submit(
            {
                reportId: String(resolveModal.id),
                _action: 'resolve',
                status: resolveStatus,
                adminNotes,
            },
            { method: 'POST' }
        );
        setResolveModal(null);
        setAdminNotes('');
        setResolveStatus('PARDONED');
    };

    const handleDeletePet = () => {
        if (!deleteConfirm) return;
        fetcher.submit(
            {
                _action: 'deletePet',
                petId: String(deleteConfirm.petId),
                reportId: String(deleteConfirm.reportId),
            },
            { method: 'POST' }
        );
        setDeleteConfirm(null);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="space-y-6">
            {/* Resolve Modal */}
            {resolveModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-lg mx-4 shadow-xl w-full">
                        <h3 className="text-lg font-semibold mb-4">Resolve Report</h3>

                        <div className="space-y-4">
                            {/* Report summary */}
                            <div className="bg-muted/50 rounded-lg p-3 text-sm">
                                <p><strong>Pet:</strong> {resolveModal.petName} ({resolveModal.petSpecies} - {resolveModal.petBreed})</p>
                                <p><strong>Reporter:</strong> {resolveModal.reporterName} ({resolveModal.reporterEmail})</p>
                                <p><strong>Reasons:</strong> {resolveModal.reasons.map(r => REPORT_REASON_LABELS[r as ReportReason] || r).join(', ')}</p>
                                {resolveModal.additionalDetails && (
                                    <p className="mt-2"><strong>Details:</strong> {resolveModal.additionalDetails}</p>
                                )}
                            </div>

                            {/* Status selection */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Resolution</label>
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setResolveStatus('PARDONED')}
                                        className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${resolveStatus === 'PARDONED' ? 'border-green-500 bg-green-100 text-green-700' : 'border-border hover:bg-green-50 hover:text-green-700'}`}
                                    >
                                        <XCircle className="w-4 h-4 inline mr-1.5" />
                                        Pardon
                                    </button>
                                    <button
                                        onClick={() => setResolveStatus('BANNED')}
                                        className={`flex-1 py-2 px-4 rounded-lg border text-sm font-medium transition-all ${resolveStatus === 'BANNED' ? 'border-red-500 bg-red-100 text-red-700' : 'border-border hover:bg-red-50 hover:text-red-700'}`}
                                    >
                                        <AlertTriangle className="w-4 h-4 inline mr-1.5" />
                                        Ban
                                    </button>
                                </div>
                            </div>

                            {/* Admin notes */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Admin Notes</label>
                                <textarea
                                    value={adminNotes}
                                    onChange={(e) => setAdminNotes(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Add notes about your decision..."
                                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                            </div>

                            {/* Quick action: delete pet */}
                            <div className="border-t pt-3">
                                <button
                                    onClick={() => {
                                        setResolveModal(null);
                                        setDeleteConfirm({
                                            reportId: resolveModal.id,
                                            petId: resolveModal.petId,
                                            petName: resolveModal.petName,
                                        });
                                    }}
                                    className="text-sm text-destructive hover:underline"
                                >
                                    Delete this pet listing instead →
                                </button>
                            </div>
                        </div>

                        <div className="flex gap-3 justify-end mt-6">
                            <button
                                className="px-4 py-2 rounded-md text-sm font-medium border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-100 hover:border-zinc-400 transition-colors"
                                onClick={() => {
                                    setResolveModal(null);
                                    setAdminNotes('');
                                }}
                            >
                                Cancel
                            </button>
                            <Button onClick={handleResolveSubmit}>
                                Resolve Report
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Pet Confirmation Modal */}
            {deleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-card rounded-xl p-6 max-w-md mx-4 shadow-xl">
                        <h3 className="text-lg font-semibold mb-2">Delete Pet Listing</h3>
                        <p className="text-muted-foreground mb-4">
                            Are you sure you want to delete <strong>{deleteConfirm.petName}</strong>? This action cannot be undone.
                        </p>
                        <div className="flex gap-3 justify-end">
                            <button
                                className="px-4 py-2 rounded-md text-sm font-medium border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-100 hover:border-zinc-400 transition-colors"
                                onClick={() => setDeleteConfirm(null)}
                            >
                                Cancel
                            </button>
                            <Button variant="destructive" onClick={handleDeletePet}>
                                Delete Pet
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <Flag className="w-7 h-7 text-amber-500" />
                    Reports
                </h1>
                <p className="text-muted-foreground mt-2">
                    Review and resolve user-submitted reports on pet listings.
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-amber-500">{pendingCount}</p>
                        <p className="text-muted-foreground text-sm">Pending</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-blue-500">{reviewedCount}</p>
                        <p className="text-muted-foreground text-sm">Reviewed</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-zinc-500">{pardonedCount}</p>
                        <p className="text-muted-foreground text-sm">Pardoned</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-3xl font-bold text-red-500">{bannedCount}</p>
                        <p className="text-muted-foreground text-sm">Banned</p>
                    </CardContent>
                </Card>
            </div>

            {/* Reports Table */}
            <Card>
                <CardHeader className="border-b">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h2 className="text-lg font-semibold">All Reports</h2>
                        <div className="flex gap-3 items-center flex-wrap">
                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
                                className="px-3 py-2 border rounded-lg bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            >
                                <option value="all">All Statuses</option>
                                <option value="PENDING">Pending</option>
                                <option value="REVIEWED">Reviewed</option>
                                <option value="PARDONED">Pardoned</option>
                                <option value="BANNED">Banned</option>
                            </select>
                            {/* Search */}
                            <input
                                type="text"
                                placeholder="Search reports..."
                                value={searchQuery}
                                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                className="px-4 py-2 border rounded-lg bg-background text-foreground w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-primary/50"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b bg-muted/50">
                                    <th className="text-left py-3 px-4 font-medium">ID</th>
                                    <th className="text-left py-3 px-4 font-medium">Pet</th>
                                    <th className="text-left py-3 px-4 font-medium">Reporter</th>
                                    <th className="text-left py-3 px-4 font-medium">Reasons</th>
                                    <th className="text-left py-3 px-4 font-medium">Date</th>
                                    <th className="text-left py-3 px-4 font-medium">Status</th>
                                    <th className="text-left py-3 px-4 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {paginatedReports.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-8 text-center text-muted-foreground">
                                            {searchQuery || statusFilter !== 'all'
                                                ? 'No reports found matching your filters'
                                                : 'No reports yet — the platform is clean!'}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedReports.map((report: ReportDTO) => (
                                        <tr key={report.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="py-3 px-4 text-muted-foreground">#{report.id}</td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <Link to={`/pets/${report.petId}?origin=admin`} className="font-medium hover:text-coral transition-colors">
                                                        {report.petName}
                                                    </Link>
                                                    <p className="text-muted-foreground text-xs">{report.petSpecies} - {report.petBreed}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="font-medium">{report.reporterName}</p>
                                                    <p className="text-muted-foreground text-xs">{report.reporterEmail}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-1 flex-wrap max-w-[200px]">
                                                    {report.reasons.map((reason: string) => (
                                                        <span
                                                            key={reason}
                                                            className="px-1.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded text-[11px] font-medium"
                                                        >
                                                            {REPORT_REASON_LABELS[reason as ReportReason] || reason}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-muted-foreground text-xs whitespace-nowrap">
                                                {formatDate(report.createdAt)}
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${STATUS_COLORS[report.status as ReportStatus] || 'bg-zinc-100 text-zinc-600'}`}>
                                                    {REPORT_STATUS_LABELS[report.status as ReportStatus] || report.status}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        asChild
                                                    >
                                                        <Link to={`/pets/${report.petId}?origin=reports`}>
                                                            <Eye className="w-3.5 h-3.5 mr-1" />
                                                            View
                                                        </Link>
                                                    </Button>
                                                    {report.status === 'PENDING' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => {
                                                                setResolveModal(report);
                                                                setAdminNotes('');
                                                                setResolveStatus('PARDONED');
                                                            }}
                                                        >
                                                            Resolve
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                        disabled={currentPage === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={currentPage === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
