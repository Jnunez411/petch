export interface ReportDTO {
    id: number;
    petId: number;
    petName: string;
    petSpecies: string;
    petBreed: string;
    reporterId: number;
    reporterEmail: string;
    reporterName: string;
    reasons: string[];
    additionalDetails?: string;
    status: ReportStatus;
    adminNotes?: string;
    createdAt: string;
    resolvedAt?: string;
}

export type ReportStatus = 'PENDING' | 'REVIEWED' | 'PARDONED' | 'BANNED';

export type ReportReason =
    | 'INAPPROPRIATE_CONTENT'
    | 'MALICIOUS_LINK'
    | 'FAKE_LISTING'
    | 'SCAM_OR_FRAUD'
    | 'ANIMAL_ABUSE'
    | 'DUPLICATE_LISTING'
    | 'OTHER';

export const REPORT_REASON_LABELS: Record<ReportReason, string> = {
    INAPPROPRIATE_CONTENT: 'Inappropriate content',
    MALICIOUS_LINK: 'Contains malicious link',
    FAKE_LISTING: 'Fake or misleading listing',
    SCAM_OR_FRAUD: 'Scam or fraud',
    ANIMAL_ABUSE: 'Suspected animal abuse',
    DUPLICATE_LISTING: 'Duplicate listing',
    OTHER: 'Other',
};

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
    PENDING: 'Pending',
    REVIEWED: 'Reviewed',
    PARDONED: 'Pardoned',
    BANNED: 'Banned',
};
