import { useLoaderData, Link, redirect, useSearchParams, useFetcher } from "react-router";
import type { Route } from "./+types/pet.$id";
import { useRef, useState, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Heart, Flag, CreditCard, Download, FileText } from "lucide-react";
import { getUserFromSession } from "~/services/auth";
import { getSession } from "~/services/session.server";
import { FAKE_PETS, type FakePet } from '~/data/fake-pets';
import { API_BASE_URL, getImageUrl } from '~/config/api-config';
import { PLACEHOLDER_IMAGES } from '~/config/constants';
import ReportModal from '~/components/ReportModal';

interface Image {
  id: number;
  fileName: string;
  filePath: string;
  altText: string;
  fileSize: number;
  createdAt: string;
}

interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  verificationStatus?: 'UNVERIFIED' | 'PENDING' | 'VERIFIED' | 'REJECTED';
}

interface AdoptionDetails {
  id: number;
  isDirect: boolean;
  priceEstimate: number;
  stepsDescription: string;
  redirectLink: string;
  phoneNumber: string;
  email: string;
}

interface OnlineFormTemplateInfo {
  hasOnlineFormPdf?: boolean;
  onlineFormFileName?: string;
}

interface PetDocumentFile {
  id: number;
  fileName: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
}

interface AdoptionFormSubmission {
  id: number;
  petId: number;
  adopterUserId: number;
  adopterName: string;
  adopterEmail: string;
  fileName: string;
  contentType: string;
  createdAt: string;
}

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  description: string;
  atRisk: boolean;
  fosterable: boolean;
  real: boolean;
  onHold?: boolean;
  images: Image[];
  user: User;
  adoptionDetails?: AdoptionDetails;
  createdAt: string;
  updatedAt: string;
}

export function meta({ data }: Route.MetaArgs) {
  const pet = data?.pet as Pet | undefined;
  return [
    { title: pet ? `${pet.name} - Petch` : 'Pet Details - Petch' },
    { name: 'description', content: pet?.description || 'View pet details' },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  // Require authentication
  const user = await getUserFromSession(request);
  if (!user) {
    return redirect('/login');
  }

  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');

  // Check if it's a fake pet first
  const petId = parseInt(params.id);
  const fakePet = FAKE_PETS.find(p => p.id === petId);

  if (fakePet) {
    // Map FakePet to the Pet interface expected by the component
    const mappedPet: Pet = {
      id: fakePet.id,
      name: fakePet.name,
      species: fakePet.species,
      breed: fakePet.breed,
      age: fakePet.age,
      description: fakePet.description,
      atRisk: fakePet.atRisk,
      fosterable: fakePet.fosterable,
      real: fakePet.real ?? false,
      images: [
        {
          id: -1,
          fileName: 'fake-image',
          filePath: fakePet.imageUrl,
          altText: fakePet.name,
          fileSize: 0,
          createdAt: new Date().toISOString()
        }
      ],
      user: {
        id: -1,
        firstName: 'System',
        lastName: 'Demo',
        email: 'demo@petch.com'
      },
      adoptionDetails: {
        id: -1,
        isDirect: true,
        priceEstimate: fakePet.priceEstimate,
        stepsDescription: fakePet.stepsDescription,
        redirectLink: '',
        phoneNumber: '(555) 123-4567',
        email: 'adopt@petch.com'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    return {
      pet: mappedPet,
      apiBaseUrl: '',
      token,
      sessionUser: user,
      onlineFormTemplate: null,
      submissions: [] as AdoptionFormSubmission[],
      petDocuments: [] as PetDocumentFile[],
      isFavorited: false,
    };
  }

  try {
    const response = await fetch(`${API_BASE_URL}/api/pets/${params.id}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });

    if (!response.ok) {
      throw new Error("Pet not found");
    }

    const pet = await response.json();

    let onlineFormTemplate: OnlineFormTemplateInfo | null = null;
    let petDocuments: PetDocumentFile[] = [];
    try {
      const templateResponse = await fetch(
        `${API_BASE_URL}/api/v1/vendor/adoption-preferences/pets/${params.id}/online-form-template/info`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        }
      );

      if (templateResponse.ok) {
        onlineFormTemplate = await templateResponse.json();
      }
    } catch {
      onlineFormTemplate = null;
    }

    try {
      const documentsResponse = await fetch(`${API_BASE_URL}/api/pets/${params.id}/documents`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
      });

      if (documentsResponse.ok) {
        const documentsPayload = await documentsResponse.json();
        petDocuments = Array.isArray(documentsPayload?.documents) ? documentsPayload.documents : [];
      }
    } catch {
      petDocuments = [];
    }

    let submissions: AdoptionFormSubmission[] = [];
    if (onlineFormTemplate?.hasOnlineFormPdf) {
      try {
        const submissionsResponse = await fetch(`${API_BASE_URL}/api/pets/${params.id}/adoption-form-submissions`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
          },
        });

        if (submissionsResponse.ok) {
          submissions = await submissionsResponse.json();
        }
      } catch {
        submissions = [];
      }
    }

    // Check if this pet is favorited
    let isFavorited = false;
    if (token) {
      try {
        const favIdsRes = await fetch(`${API_BASE_URL}/api/pets/favorites/ids`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (favIdsRes.ok) {
          const favIds: number[] = await favIdsRes.json();
          isFavorited = favIds.includes(pet.id);
        }
      } catch {
        // ignore
      }
    }

    return { pet, apiBaseUrl: API_BASE_URL, token, sessionUser: user, onlineFormTemplate, submissions, petDocuments, isFavorited };
  } catch (error) {
    throw new Response("Pet not found", { status: 404 });
  }
}

export async function action({ request, params }: Route.ActionArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  if (!token) return { error: 'Not authenticated' };

  const formData = await request.formData();
  const intent = formData.get('intent');

  if (intent === 'favorite') {
    try {
      const res = await fetch(`${API_BASE_URL}/api/pets/${params.id}/favorite`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const result = await res.json();
        return { success: true, favorited: result.favorited };
      }
      return { error: 'Failed to toggle favorite' };
    } catch {
      return { error: 'Failed to toggle favorite' };
    }
  }

  if (intent === 'report') {
    const reasons = formData.get('reasons') as string;
    const additionalDetails = formData.get('additionalDetails') as string;
    if (!reasons) {
      return { error: 'At least one reason is required' };
    }
    try {
      const parsedReasons = JSON.parse(reasons);
      const res = await fetch(`${API_BASE_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          petId: Number(formData.get('petId')),
          reasons: parsedReasons,
          additionalDetails: additionalDetails || null,
        }),
      });
      if (res.status === 409) {
        return { error: 'You have already reported this listing' };
      }
      if (res.ok) {
        return { success: true, intent: 'report' };
      }
      return { error: 'Failed to submit report' };
    } catch {
      return { error: 'Failed to submit report' };
    }
  }

  return { error: 'Unknown action' };
}

export default function PetDetail() {
  const { pet, apiBaseUrl, token, sessionUser, onlineFormTemplate, submissions = [], petDocuments = [], isFavorited: loaderFavorited } = useLoaderData<typeof loader>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAdoptionDetails, setShowAdoptionDetails] = useState(false);
  const [submissionFile, setSubmissionFile] = useState<File | null>(null);
  const [isUploadingSubmission, setIsUploadingSubmission] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [visibleSubmissions, setVisibleSubmissions] = useState(submissions);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isFavorited, setIsFavorited] = useState(loaderFavorited ?? false);
  const [showReportModal, setShowReportModal] = useState(false);
  const fetcher = useFetcher();

  const handleToggleFavorite = () => {
    setIsFavorited(prev => !prev);
    fetcher.submit({ intent: 'favorite' }, { method: 'POST' });
  };

  // Rollback optimistic favorite toggle on server error
  useEffect(() => {
    if (fetcher.state === 'idle' && fetcher.data) {
      const data = fetcher.data as { error?: string; favorited?: boolean };
      if (data.error) {
        setIsFavorited(prev => !prev);
      } else if (typeof data.favorited === 'boolean') {
        setIsFavorited(data.favorited);
      }
    }
  }, [fetcher.state, fetcher.data]);

  const mainImage = pet.images?.[selectedImageIndex];
  const isVendorOwner = sessionUser?.userType === 'VENDOR' && pet.user?.email === sessionUser.email;
  const petIsOnHold = pet.onHold === true;
  const canUploadSubmission = !!sessionUser && !petIsOnHold;
  const canViewSubmissionSection = !!sessionUser;
  const canUseOnlineForm = !petIsOnHold
    && !!onlineFormTemplate?.hasOnlineFormPdf
    && !pet.adoptionDetails?.isDirect
    && !pet.adoptionDetails?.redirectLink;

  const setSelectedSubmissionFile = (file: File | null) => {
    if (!file) {
      setSubmissionFile(null);
      return;
    }

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');

    if (!isPdf) {
      setSubmissionFile(null);
      setSubmissionSuccess(null);
      setSubmissionError('Only PDF files are allowed.');
      return;
    }

    setSubmissionError(null);
    setSubmissionSuccess(null);
    setSubmissionFile(file);
  };

  const openSubmissionFilePicker = () => {
    if (canUploadSubmission) {
      fileInputRef.current?.click();
    }
  };

  const handleSubmissionDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    if (!canUploadSubmission) {
      return;
    }

    event.preventDefault();
    setIsDragActive(true);
  };

  const handleSubmissionDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if (!canUploadSubmission) {
      return;
    }

    event.preventDefault();
    setIsDragActive(false);
  };

  const handleSubmissionDrop = (event: React.DragEvent<HTMLDivElement>) => {
    if (!canUploadSubmission) {
      return;
    }

    event.preventDefault();
    setIsDragActive(false);
    setSelectedSubmissionFile(event.dataTransfer.files?.[0] || null);
  };

  const getImageUrlLocal = (filePath: string) => {
    if (!filePath) return '';
    return getImageUrl(filePath) || '';
  };

  const downloadProtectedFile = async (url: string, filename: string) => {
    if (!token) {
      return;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = objectUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(objectUrl);
  };

  const handleDownloadTemplate = async () => {
    try {
      await downloadProtectedFile(
        `${apiBaseUrl}/api/v1/vendor/adoption-preferences/pets/${pet.id}/online-form-template`,
        onlineFormTemplate?.onlineFormFileName || `${pet.name}-adoption-form.pdf`
      );
    } catch {
      setSubmissionError('Failed to download the adoption form. Please try again.');
    }
  };

  const handleDownloadSubmission = async (submission: AdoptionFormSubmission) => {
    try {
      await downloadProtectedFile(
        `${apiBaseUrl}/api/pets/${pet.id}/adoption-form-submissions/${submission.id}/download`,
        submission.fileName
      );
    } catch {
      setSubmissionError('Failed to download the submitted form. Please try again.');
    }
  };

  const handleDownloadPetDocument = async (document: PetDocumentFile) => {
    try {
      await downloadProtectedFile(
        `${apiBaseUrl}/api/pets/${pet.id}/documents/${document.id}/download`,
        document.fileName
      );
    } catch {
      setSubmissionError('Failed to download the pet document. Please try again.');
    }
  };

  const handleUploadSubmission = async () => {
    if (!submissionFile) {
      setSubmissionError('Choose a completed PDF before uploading.');
      return;
    }

    if (!token) {
      setSubmissionError('Your session expired. Log in again and retry the upload.');
      return;
    }

    setSubmissionError(null);
    setSubmissionSuccess(null);
    setIsUploadingSubmission(true);

    try {
      const formData = new FormData();
      formData.append('file', submissionFile);

      const response = await fetch(`${apiBaseUrl}/api/pets/${pet.id}/adoption-form-submissions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const savedSubmission = await response.json();

      setSubmissionFile(null);
      setSubmissionSuccess('Your completed adoption form was uploaded successfully.');
      setVisibleSubmissions((prev) => [savedSubmission, ...prev]);
    } catch {
      setSubmissionError('Failed to upload the completed adoption form. Please make sure it is a PDF and try again.');
    } finally {
      setIsUploadingSubmission(false);
    }
  };

  const [searchParams] = useSearchParams();
  const origin = searchParams.get('origin');
  const returnTo = searchParams.get('returnTo');

  // Use returnTo if available (preserves filter state), otherwise fall back to origin-based logic
  let backLink = returnTo ? decodeURIComponent(returnTo) : '/pets';
  let backText = '← Back to Pets';

  if (!returnTo) {
    if (origin === 'discover') {
      backLink = '/discover';
      backText = '← Back to Discovery';
    } else if (origin === 'admin') {
      backLink = '/admin/pets';
      backText = '← Back to Admin Listings';
    } else if (origin === 'reports') {
      backLink = '/admin/reports';
      backText = '← Back to Reports';
    } else if (origin === 'profile') {
      backLink = '/profile';
      backText = '← Back to Profile';
    } else if (origin === 'favorites') {
      backLink = '/favorites';
      backText = '← Back to Favorites';
    }
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to={backLink} className="text-coral hover:text-coral-dark font-medium">
            {backText}
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div>
            {/* Main Image */}
            <Card className="overflow-hidden bg-card shadow-lg">
              {mainImage ? (
                <img
                  src={getImageUrl(mainImage.filePath)}
                  alt={mainImage.altText || pet.name}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <img
                  src={PLACEHOLDER_IMAGES[pet.species] || PLACEHOLDER_IMAGES.default}
                  alt={pet.name}
                  className="w-full h-96 object-cover"
                />
              )}
            </Card>

            {/* Thumbnail Gallery */}
            {pet.images && pet.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {pet.images.map((img: Image, idx: number) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${idx === selectedImageIndex
                      ? "border-coral shadow-md"
                      : "border-muted hover:border-coral/50"
                      }`}
                  >
                    <img
                      src={getImageUrl(img.filePath)}
                      alt={img.altText || pet.name}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pet Information */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">{pet.name}</h1>
              <div className="flex gap-3 flex-wrap">
                <span className="inline-block bg-coral/10 text-coral px-4 py-2 rounded-full font-semibold">
                  {pet.species}
                </span>
                <span className="inline-block bg-teal/10 text-teal px-4 py-2 rounded-full">
                  {pet.breed}
                </span>
                {pet.atRisk && (
                  <span className="inline-block bg-destructive/10 text-destructive px-4 py-2 rounded-full font-semibold">
                    At Risk
                  </span>
                )}
                {pet.fosterable && (
                  <span className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full">
                    Fosterable
                  </span>
                )}
                {pet.real && (
                  <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full font-semibold">
                    Real
                  </span>
                )}
              </div>
            </div>

            {/* Big Details Card */}
            <Card className="bg-card p-6 shadow-md">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Age</p>
                  <p className="text-2xl font-bold text-foreground">{pet.age} years old</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-sm font-medium">Status</p>
                  <p className="text-2xl font-bold text-green-600">Available</p>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="bg-card p-6 shadow-md">
              <h2 className="text-xl font-bold text-foreground mb-3">About {pet.name}</h2>
              <p className="text-muted-foreground leading-relaxed text-lg">
                {pet.description || "No description available for this pet."}
              </p>
            </Card>

            {/* Additional Info */}
            <Card className="bg-card p-6 shadow-md">
              <h2 className="text-xl font-bold text-foreground mb-4">Pet Information</h2>
              <dl className="space-y-4">
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <dt className="text-muted-foreground font-medium">Species</dt>
                  <dd className="text-foreground font-semibold">{pet.species}</dd>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <dt className="text-muted-foreground font-medium">Breed</dt>
                  <dd className="text-foreground font-semibold">{pet.breed}</dd>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <dt className="text-muted-foreground font-medium">Age</dt>
                  <dd className="text-foreground font-semibold">{pet.age} years</dd>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <dt className="text-muted-foreground font-medium">At Risk</dt>
                  <dd className="text-foreground font-semibold">
                    {pet.atRisk ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <dt className="text-muted-foreground font-medium">Fosterable</dt>
                  <dd className="text-foreground font-semibold">
                    {pet.fosterable ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="flex justify-between items-center border-b border-border pb-3">
                  <dt className="text-muted-foreground font-medium">Real</dt>
                  <dd className="text-foreground font-semibold">
                    {pet.real ? "Yes" : "No"}
                  </dd>
                </div>
                {pet.user && (
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground font-medium">Uploaded by</dt>
                    <dd className="text-foreground font-semibold flex items-center gap-2">
                      <span>{pet.user.firstName} {pet.user.lastName}</span>
                      {pet.user.verificationStatus === 'VERIFIED' && (
                        <span className="inline-flex items-center rounded-full bg-teal/10 px-2 py-0.5 text-xs font-semibold text-teal">
                          Verified Vendor
                        </span>
                      )}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {petDocuments.length > 0 && (
              <Card className="bg-card p-6 shadow-md">
                <h2 className="text-xl font-bold text-foreground mb-4">Pet Documents</h2>
                <div className="space-y-3">
                  {petDocuments.map((document) => (
                    <div
                      key={document.id}
                      className="flex flex-col gap-3 rounded-lg border border-border bg-muted/20 p-4 md:flex-row md:items-center md:justify-between"
                    >
                      <div>
                        <p className="font-semibold text-foreground">{document.fileName}</p>
                        <p className="text-sm text-muted-foreground">
                          {(document.fileSize / 1024 / 1024).toFixed(2)} MB • Uploaded {new Date(document.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <Button type="button" variant="outline" onClick={() => handleDownloadPetDocument(document)}>
                        Download Document
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => setShowAdoptionDetails(!showAdoptionDetails)}
                className="flex-1 bg-coral hover:bg-coral-dark text-white py-3 text-lg font-semibold"
              >
                {showAdoptionDetails ? 'Hide Adoption Details' : 'View Adoption Details'}
              </Button>
              <Button
                onClick={handleToggleFavorite}
                variant="outline"
                className={`py-3 px-5 text-lg font-semibold transition-all duration-200 ${isFavorited
                    ? 'border-rose-300 bg-rose-50 text-rose-600 hover:bg-rose-100'
                    : 'border-border hover:border-rose-300 hover:text-rose-500'
                  }`}
              >
                <Heart className={`w-5 h-5 mr-2 transition-all duration-200 ${isFavorited ? 'fill-rose-500 text-rose-500' : ''
                  }`} />
                {isFavorited ? 'Favorited' : 'Favorite'}
              </Button>
              <Button
                onClick={() => setShowReportModal(true)}
                variant="outline"
                className="py-3 px-5 text-lg font-semibold border-amber-300 text-amber-600 hover:bg-amber-50 hover:border-amber-400 transition-all duration-200"
              >
                <Flag className="w-5 h-5 mr-2" />
                Report
              </Button>
            </div>

            {/* Adoption Details */}
            {showAdoptionDetails && pet.adoptionDetails && (
              <Card className="bg-card p-6 shadow-md border-2 border-coral">
                <h2 className="text-2xl font-bold text-foreground mb-4">Adoption Details</h2>

                <div className="space-y-4">
                  {/* Cost */}
                  <div className="border-b border-border pb-4">
                    <p className="text-muted-foreground text-sm font-medium">Estimated Adoption Cost</p>
                    <p className="text-2xl font-bold text-coral">${pet.adoptionDetails.priceEstimate?.toFixed(2) || '0.00'}</p>
                    <Link 
                      to={`/checkout?pet_id=${pet.id}&pet_name=${encodeURIComponent(pet.name)}&price=${Math.round((pet.adoptionDetails.priceEstimate || 0) * 100)}`}
                      className="inline-block mt-3"
                    >
                      <Button className="bg-coral hover:bg-coral-dark text-white">
                        <CreditCard className="w-4 h-4 mr-2" />
                        Pay Adoption Fee
                      </Button>
                    </Link>
                  </div>

                  {/* Steps Description */}
                  <div className="border-b border-border pb-4">
                    <p className="text-muted-foreground text-sm font-medium mb-2">Adoption Process</p>
                    <p className="text-foreground leading-relaxed">
                      {pet.adoptionDetails.stepsDescription || 'No process description available'}
                    </p>
                  </div>

                  {/* On-hold banner */}
                  {petIsOnHold && !isVendorOwner && (
                    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4">
                      <div>
                        <p className="font-semibold text-amber-800">This pet is currently in the adoption process</p>
                        <p className="text-sm text-amber-700 mt-0.5">An adoption application has been accepted. New submissions are not being accepted at this time.</p>
                      </div>
                    </div>
                  )}

                  {/* Direct vs Redirect vs Online Form */}
                  {canUseOnlineForm ? (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
                      <div>
                        <h3 className="font-semibold text-blue-900 mb-2">Submit Adoption Form</h3>
                        <p className="text-sm text-blue-800">
                          {isVendorOwner
                            ? 'Adopters submit their completed PDF here. You can review every submission below.'
                            : 'Download the adoption form, fill it out, then upload it below.'}
                        </p>
                      </div>

                      <Button
                        type="button"
                        onClick={handleDownloadTemplate}
                        variant="outline"
                        className="border-blue-300 text-blue-800 hover:bg-blue-100"
                      >
                        Download Form PDF
                      </Button>

                      {canViewSubmissionSection && (
                        <div className="space-y-3">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="application/pdf,.pdf"
                            onChange={(event) => setSelectedSubmissionFile(event.target.files?.[0] || null)}
                            className="hidden"
                          />

                          {(() => {
                            const presaved = !submissionFile && visibleSubmissions.length > 0 ? visibleSubmissions[0] : null;
                            return (
                              <div
                                role={canUploadSubmission ? 'button' : undefined}
                                tabIndex={canUploadSubmission ? 0 : -1}
                                onClick={openSubmissionFilePicker}
                                onKeyDown={(event) => {
                                  if (!canUploadSubmission) return;
                                  if (event.key === 'Enter' || event.key === ' ') {
                                    event.preventDefault();
                                    openSubmissionFilePicker();
                                  }
                                }}
                                onDragOver={handleSubmissionDragOver}
                                onDragLeave={handleSubmissionDragLeave}
                                onDrop={handleSubmissionDrop}
                                className={`rounded-xl border-2 border-dashed p-6 text-center transition ${canUploadSubmission ? 'cursor-pointer' : 'cursor-default'} ${isDragActive ? 'border-coral bg-coral/10' : 'border-blue-300 bg-white/60'} ${!canUploadSubmission ? 'opacity-80' : ''}`}
                              >
                                <p className="font-medium text-blue-900">
                                  {submissionFile
                                    ? `Selected: ${submissionFile.name}`
                                    : presaved
                                      ? presaved.fileName
                                      : canUploadSubmission
                                        ? 'Drag and drop your completed PDF here'
                                        : 'Sign in to upload a submission'}
                                </p>
                                <p className="mt-1 text-sm text-blue-700">
                                  {submissionFile
                                    ? 'Click to choose a different file.'
                                    : presaved
                                      ? 'This file is from your previous submission. Click to upload a new one.'
                                      : canUploadSubmission
                                        ? 'Or click to browse for a completed PDF.'
                                        : 'No submissions have been uploaded yet.'}
                                </p>
                              </div>
                            );
                          })()}

                          {canUploadSubmission && (
                            <Button
                              type="button"
                              onClick={handleUploadSubmission}
                              disabled={isUploadingSubmission || !submissionFile}
                              className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                              {isUploadingSubmission ? 'Uploading...' : 'Upload Completed Form'}
                            </Button>
                          )}
                        </div>
                      )}

                      {submissionError && (
                        <p className="text-sm text-red-600">{submissionError}</p>
                      )}

                      {submissionSuccess && (
                        <p className="text-sm text-green-700">{submissionSuccess}</p>
                      )}

                      {visibleSubmissions.length > 0 && (
                        <div className="mt-4 space-y-3">
                          <h4 className="text-sm font-semibold text-blue-900">Submitted Forms</h4>
                          {visibleSubmissions.map((submission) => (
                            <div
                              key={submission.id}
                              className="flex items-center justify-between rounded-lg border border-blue-200 bg-white p-3"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <FileText className="size-5 shrink-0 text-blue-600" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-medium text-blue-900">{submission.fileName}</p>
                                  <p className="text-xs text-blue-600">
                                    {submission.adopterName} &middot; {new Date(submission.createdAt).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadSubmission(submission)}
                                className="shrink-0 ml-2"
                              >
                                <Download className="size-4 mr-1" />
                                Download
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}

                    </div>
                  ) : pet.adoptionDetails.isDirect ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <h3 className="font-semibold text-green-900 mb-3">Direct Contact Adoption</h3>
                      <dl className="space-y-2">
                        {pet.adoptionDetails.phoneNumber && (
                          <div className="flex justify-between items-center">
                            <dt className="text-muted-foreground font-medium">Phone</dt>
                            <dd className="text-foreground font-semibold">{pet.adoptionDetails.phoneNumber}</dd>
                          </div>
                        )}
                        {pet.adoptionDetails.email && (
                          <div className="flex justify-between items-center">
                            <dt className="text-muted-foreground font-medium">Email</dt>
                            <dd className="text-foreground font-semibold">{pet.adoptionDetails.email}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  ) : (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h3 className="font-semibold text-blue-900 mb-3">Apply on Adoption Website</h3>
                      <dl className="space-y-2">
                        {pet.adoptionDetails.redirectLink && (
                          <div className="mb-3">
                            <dt className="text-muted-foreground font-medium mb-2">Adoption Page</dt>
                            <a
                              href={pet.adoptionDetails.redirectLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 font-semibold underline break-all"
                            >
                              {pet.adoptionDetails.redirectLink}
                            </a>
                          </div>
                        )}
                        {pet.adoptionDetails.phoneNumber && (
                          <div className="flex justify-between items-center border-t border-blue-200 pt-2">
                            <dt className="text-muted-foreground font-medium">Phone</dt>
                            <dd className="text-foreground font-semibold">{pet.adoptionDetails.phoneNumber}</dd>
                          </div>
                        )}
                        {pet.adoptionDetails.email && (
                          <div className="flex justify-between items-center border-t border-blue-200 pt-2">
                            <dt className="text-muted-foreground font-medium">Email</dt>
                            <dd className="text-foreground font-semibold">{pet.adoptionDetails.email}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  )}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Report Modal */}
      <ReportModal
        petId={pet.id}
        petName={pet.name}
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
      />
    </div>
  );
}
