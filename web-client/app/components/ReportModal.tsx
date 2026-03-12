import { useState, useEffect } from 'react';
import { useFetcher } from 'react-router';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader } from '~/components/ui/card';
import { Checkbox } from '~/components/ui/checkbox';
import { Label } from '~/components/ui/label';
import { AlertTriangle, X, Loader2 } from 'lucide-react';
import { REPORT_REASON_LABELS } from '~/types/report';
import type { ReportReason } from '~/types/report';

interface ReportModalProps {
    petId: number;
    petName: string;
    isOpen: boolean;
    onClose: () => void;
}

const ALL_REASONS: ReportReason[] = [
    'INAPPROPRIATE_CONTENT',
    'MALICIOUS_LINK',
    'FAKE_LISTING',
    'SCAM_OR_FRAUD',
    'ANIMAL_ABUSE',
    'DUPLICATE_LISTING',
    'OTHER',
];

export default function ReportModal({ petId, petName, isOpen, onClose }: ReportModalProps) {
    const fetcher = useFetcher();
    const [selectedReasons, setSelectedReasons] = useState<Set<ReportReason>>(new Set());
    const [additionalDetails, setAdditionalDetails] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isSubmitting = fetcher.state === 'submitting';

    // Watch fetcher response to determine success/error after server responds
    useEffect(() => {
        if (fetcher.state === 'idle' && fetcher.data) {
            const data = fetcher.data as { success?: boolean; error?: string; intent?: string };
            if (data.success) {
                setSubmitted(true);
                setError(null);
            } else if (data.error) {
                setError(data.error);
                setSubmitted(false);
            }
        }
    }, [fetcher.state, fetcher.data]);

    const handleToggleReason = (reason: ReportReason) => {
        setSelectedReasons(prev => {
            const next = new Set(prev);
            if (next.has(reason)) {
                next.delete(reason);
            } else {
                next.add(reason);
            }
            return next;
        });
        setError(null);
    };

    const handleSubmit = () => {
        if (selectedReasons.size === 0) {
            setError('Please select at least one reason.');
            return;
        }

        fetcher.submit(
            {
                intent: 'report',
                petId: petId.toString(),
                reasons: JSON.stringify(Array.from(selectedReasons)),
                additionalDetails,
            },
            { method: 'POST' }
        );
    };

    const handleClose = () => {
        setSelectedReasons(new Set());
        setAdditionalDetails('');
        setSubmitted(false);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <Card className="relative z-10 w-full max-w-md shadow-xl">
                {/* Close button */}
                <button
                    onClick={handleClose}
                    className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <CardHeader className="pb-4">
                    <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-amber-100 flex items-center justify-center">
                            <AlertTriangle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold">Report This Listing</h3>
                            <p className="text-sm text-muted-foreground truncate max-w-[280px]">
                                {petName}
                            </p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="space-y-5">
                    {submitted && fetcher.state === 'idle' ? (
                        /* Success state */
                        <div className="text-center py-4">
                            <div className="size-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h4 className="font-semibold text-lg mb-1">Report Submitted</h4>
                            <p className="text-sm text-muted-foreground mb-4">
                                Thank you for helping keep Petch safe. An admin will review your report.
                            </p>
                            <Button onClick={handleClose} variant="outline">
                                Close
                            </Button>
                        </div>
                    ) : (
                        <>
                            {/* Reason checkboxes */}
                            <div>
                                <p className="text-sm font-medium mb-3">
                                    Why are you reporting this pet listing?
                                    <span className="text-muted-foreground font-normal"> (Select all that apply)</span>
                                </p>
                                <div className="space-y-3">
                                    {ALL_REASONS.map((reason) => (
                                        <div key={reason} className="flex items-center gap-3">
                                            <Checkbox
                                                id={`reason-${reason}`}
                                                checked={selectedReasons.has(reason)}
                                                onCheckedChange={() => handleToggleReason(reason)}
                                            />
                                            <Label
                                                htmlFor={`reason-${reason}`}
                                                className="text-sm font-normal cursor-pointer"
                                            >
                                                {REPORT_REASON_LABELS[reason]}
                                            </Label>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Additional details */}
                            <div>
                                <Label htmlFor="report-details" className="text-sm font-medium mb-2 block">
                                    Additional details <span className="text-muted-foreground font-normal">(optional)</span>
                                </Label>
                                <textarea
                                    id="report-details"
                                    value={additionalDetails}
                                    onChange={(e) => setAdditionalDetails(e.target.value)}
                                    maxLength={500}
                                    rows={3}
                                    placeholder="Provide any extra context that might help admins review this report..."
                                    className="w-full px-3 py-2 border rounded-lg bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/50"
                                />
                                <p className="text-xs text-muted-foreground mt-1 text-right">
                                    {additionalDetails.length}/500
                                </p>
                            </div>

                            {/* Error message */}
                            {error && (
                                <p className="text-sm text-destructive">{error}</p>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    className="flex-1 px-4 py-2 rounded-md text-sm font-medium border border-zinc-300 text-zinc-700 bg-white hover:bg-zinc-100 hover:border-zinc-400 transition-colors disabled:opacity-50"
                                    onClick={handleClose}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <Button
                                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || selectedReasons.size === 0}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        'Submit Report'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
