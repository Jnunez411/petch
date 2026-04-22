/**
 * Pet-related type definitions
 * Use these instead of `any` for type safety
 */

export interface PetImage {
    id: number;
    filePath: string;
    altText?: string;
}

export interface AdoptionDetails {
    priceEstimate: number;
    isDirect: boolean;
    stepsDescription?: string;
    phoneNumber?: string;
    email?: string;
    redirectLink?: string;
    redirectPhoneNumber?: string;
    redirectEmail?: string;
}

export interface AdoptionFormSubmission {
    id: number;
    petId: number;
    petName?: string;
    adopterUserId: number;
    adopterName: string;
    adopterEmail: string;
    fileName: string;
    contentType: string;
    priceEstimate?: number;
    createdAt: string;
}

export type AppointmentType = 'PICKUP' | 'MEETUP';
export type PaymentOption = 'IN_PERSON' | 'ONLINE' | 'BOTH';
export type AppointmentStatus = 'PENDING' | 'CONFIRMED';

export interface AdoptionAppointment {
    id: number;
    submissionId: number;
    petId: number;
    petName?: string;
    adopterUserId: number;
    adopterEmail: string;
    vendorUserId: number;
    appointmentType: AppointmentType;
    location: string;
    appointmentDate: string;
    availableTimes: string;
    paymentOption: PaymentOption;
    additionalInfo?: string;
    selectedTime?: string;
    status: AppointmentStatus;
    vendorConfirmed?: boolean;
    createdAt: string;
}

export interface PetDocumentFile {
    id: number;
    fileName: string;
    contentType: string;
    fileSize: number;
    createdAt: string;
}

export interface PetDocuments {
    petId: number;
    documents: PetDocumentFile[];
}

export interface Pet {
    id: number;
    name: string;
    species: string;
    breed: string;
    age: number;
    description?: string;
    atRisk: boolean;
    fosterable: boolean;
    real: boolean;
    isAdopted?: boolean;
    images: PetImage[];
    adoptionDetails?: AdoptionDetails;
    userId?: number;
}

/** Pet interaction history for undo functionality */
export interface SwipeHistory {
    pet: Pet;
    direction: 'left' | 'right';
}

/** User preferences for pet discovery */
export interface UserPreferences {
    likedPetIds: number[];
    passedPetIds: number[];
    totalSwipes: number;
}
