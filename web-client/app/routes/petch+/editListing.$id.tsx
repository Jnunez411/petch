import { useState, useRef } from 'react';
import type { DragEvent } from 'react';
import { useNavigate, Link, useLoaderData, redirect } from 'react-router';
import type { Route } from './+types/editListing.$id';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';
import { getSession } from '~/services/session.server';
import { getUserFromSession } from '~/services/auth';
import { ImageIcon, X, AlertCircle, CheckCircle, FileText } from 'lucide-react';
import { createLogger } from '~/utils/logger';
import { API_BASE_URL, getImageUrl } from '~/config/api-config';

const logger = createLogger('EditListing');

type ListingAdoptionMethod = 'DIRECT' | 'REDIRECT' | 'ONLINE_FORM';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Edit Pet Listing - Petch' },
    { name: 'description', content: 'Edit your pet listing' },
  ];
}

export async function loader({ request, params }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  if (!token || !user) {
    return redirect(`/login?redirectTo=/pets/${params.id}/edit`);
  }

  const [userResponse, petResponse, documentsResponse] = await Promise.all([
    fetch(`${API_BASE_URL}/api/users/me`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }),
    fetch(`${API_BASE_URL}/api/pets/${params.id}`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }),
    fetch(`${API_BASE_URL}/api/pets/${params.id}/documents`, {
      headers: { 'Authorization': `Bearer ${token}` },
    }),
  ]);

  if (!userResponse.ok || !petResponse.ok) {
    return redirect('/profile/vendor');
  }

  const fullUser = await userResponse.json();
  const pet = await petResponse.json();
  const documents = documentsResponse.ok ? await documentsResponse.json() : [];

  // Verify ownership
  if (pet.userId !== fullUser.id && user.userType !== 'ADMIN') {
    return redirect('/profile/vendor');
  }

  return { token, user, pet, documents };
}

function determineMethod(adoptionDetails: any): ListingAdoptionMethod {
  if (!adoptionDetails) return 'DIRECT';
  if (adoptionDetails.isDirect) return 'DIRECT';
  if (adoptionDetails.redirectLink) return 'REDIRECT';
  if (adoptionDetails.hasOnlineFormPdf) return 'ONLINE_FORM';
  return 'DIRECT';
}

export default function EditPetPage() {
  const { token, pet, documents } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Image state
  const [existingImages, setExistingImages] = useState<any[]>(pet.images || []);
  const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Document state
  const [existingDocuments, setExistingDocuments] = useState<any[]>(documents || []);
  const [selectedDocumentFiles, setSelectedDocumentFiles] = useState<File[]>([]);
  const [isDocumentDragging, setIsDocumentDragging] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: pet.name || '',
    species: pet.species || '',
    breed: pet.breed || '',
    age: pet.age || 0,
    description: pet.description || '',
    atRisk: pet.atRisk || false,
    fosterable: pet.fosterable || false,
  });

  const ad = pet.adoptionDetails;
  const initialMethod = determineMethod(ad);
  const [adoptionDetails, setAdoptionDetails] = useState({
    method: initialMethod,
    priceEstimate: ad?.priceEstimate || 0,
    stepsDescription: ad?.stepsDescription || '',
    phoneNumber: initialMethod === 'DIRECT' ? (ad?.phoneNumber || '') : '',
    email: initialMethod === 'DIRECT' ? (ad?.email || '') : '',
    redirectLink: initialMethod === 'REDIRECT' ? (ad?.redirectLink || '') : '',
    redirectPhoneNumber: initialMethod === 'REDIRECT' ? (ad?.phoneNumber || '') : '',
    redirectEmail: initialMethod === 'REDIRECT' ? (ad?.email || '') : '',
  });

  // Touched state for validation
  const [touched, setTouched] = useState({
    name: false,
    species: false,
    breed: false,
    age: false,
    priceEstimate: false,
    stepsDescription: false,
    phoneNumber: false,
    email: false,
    redirectLink: false,
    redirectPhoneNumber: false,
    redirectEmail: false,
  });

  // Validation functions
  const validateName = (name: string) => {
    if (!name) return "What's this pet's name?";
    if (name.length < 2) return "Name should be at least 2 characters";
    if (name.length > 100) return "Name is too long (max 100 characters)";
    if (!/^[a-zA-Z0-9\s\-']+$/.test(name)) return "Name can only contain letters, numbers, spaces, hyphens, and apostrophes";
    return null;
  };

  const validateSpecies = (species: string) => {
    if (!species) return "What type of animal is this? (e.g., Dog, Cat, Bird)";
    if (species.length < 2) return "Please enter a valid species name";
    if (species.length > 50) return "Species name is too long (max 50 characters)";
    if (!/^[a-zA-Z\s\-]+$/.test(species)) return "Species can only contain letters, spaces, and hyphens";
    return null;
  };

  const validateBreed = (breed: string) => {
    if (!breed) return "What breed is this pet? (e.g., Labrador, Siamese)";
    if (breed.length < 2) return "Please enter a valid breed name";
    if (breed.length > 100) return "Breed name is too long (max 100 characters)";
    if (!/^[a-zA-Z0-9\s\-']+$/.test(breed)) return "Breed can only contain letters, numbers, spaces, hyphens, and apostrophes";
    return null;
  };

  const validateAge = (age: number) => {
    if (age < 0) return "Age can't be negative";
    if (age > 30) return "That seems like an unusually high age. Please double-check.";
    return null;
  };

  const validatePrice = (price: number) => {
    if (price < 0) return "Adoption fee can't be negative";
    if (price > 10000) return "That's quite a high fee. Please verify this is correct.";
    return null;
  };

  const validateSteps = (steps: string) => {
    if (!steps) return "Please describe the adoption process so potential adopters know what to expect";
    if (steps.length < 20) return "Please provide more detail about the adoption steps";
    return null;
  };

  const validatePhone = (phone: string) => {
    if (!phone) return "Please provide a contact phone number";
    const digitsOnly = phone.replace(/\D/g, "");
    if (digitsOnly.length < 10) return "Phone number should have at least 10 digits";
    return null;
  };

  const validateEmail = (email: string) => {
    if (!email) return "Please provide an email for inquiries";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "That doesn't look like a valid email address";
    return null;
  };

  const validateUrl = (url: string) => {
    if (!url) return "Please provide the adoption page link";
    try {
      new URL(url);
      return null;
    } catch {
      return "Please enter a valid URL (e.g., https://example.com/adopt)";
    }
  };

  // Get validation errors
  const nameError = touched.name ? validateName(formData.name) : null;
  const speciesError = touched.species ? validateSpecies(formData.species) : null;
  const breedError = touched.breed ? validateBreed(formData.breed) : null;
  const ageError = touched.age ? validateAge(formData.age) : null;
  const priceError = touched.priceEstimate ? validatePrice(adoptionDetails.priceEstimate) : null;
  const stepsError = touched.stepsDescription ? validateSteps(adoptionDetails.stepsDescription) : null;
  const phoneError = touched.phoneNumber && adoptionDetails.method === 'DIRECT'
    ? validatePhone(adoptionDetails.phoneNumber) : null;
  const emailError = touched.email && adoptionDetails.method === 'DIRECT'
    ? validateEmail(adoptionDetails.email) : null;
  const redirectLinkError = touched.redirectLink && adoptionDetails.method === 'REDIRECT'
    ? validateUrl(adoptionDetails.redirectLink) : null;
  const redirectPhoneError = touched.redirectPhoneNumber && adoptionDetails.method === 'REDIRECT'
    ? validatePhone(adoptionDetails.redirectPhoneNumber) : null;
  const redirectEmailError = touched.redirectEmail && adoptionDetails.method === 'REDIRECT'
    ? validateEmail(adoptionDetails.redirectEmail) : null;

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setFormData((prev) => ({
        ...prev,
        [name]: parseInt(value) || 0,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAdoptionDetailsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'number') {
      setAdoptionDetails((prev) => ({
        ...prev,
        [name]: parseFloat(value) || 0,
      }));
    } else {
      setAdoptionDetails((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleAdoptionTypeChange = (method: ListingAdoptionMethod) => {
    setAdoptionDetails((prev) => ({
      ...prev,
      method,
    }));
  };

  // Image handling
  const processFiles = (files: FileList | File[]) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
    const newFiles: File[] = [];
    const newPreviews: string[] = [];

    Array.from(files).forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setError('Oops! Please upload only JPEG or PNG images. Other formats are not supported.');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('That image is too large! Please keep images under 5MB.');
        return;
      }

      newFiles.push(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === newFiles.length) {
          setSelectedFiles((prev) => [...prev, ...newFiles]);
          setPreviewUrls((prev) => [...prev, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
      e.target.value = '';
    }
  };

  const removeNewImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingImage = (imageId: number) => {
    setImagesToDelete((prev) => [...prev, imageId]);
    setExistingImages((prev) => prev.filter((img: any) => img.id !== imageId));
  };

  // Document handling
  const processDocumentFiles = (files: FileList | File[]) => {
    const allowedTypes = ['application/pdf'];
    const newFiles: File[] = [];

    Array.from(files).forEach((file) => {
      const allowedByExtension = /\.pdf$/i.test(file.name);
      if (!allowedTypes.includes(file.type) && !allowedByExtension) {
        setError('Please upload PDF files only for pet documents.');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setError('That document is too large. Please keep documents under 10MB.');
        return;
      }

      newFiles.push(file);
    });

    if (newFiles.length > 0) {
      setError(null);
      setSelectedDocumentFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const handleDocumentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processDocumentFiles(files);
      e.target.value = '';
    }
  };

  const removeNewDocument = (index: number) => {
    setSelectedDocumentFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const removeExistingDocument = (docId: number) => {
    setExistingDocuments((prev) => prev.filter((doc: any) => doc.id !== docId));
  };

  // Drag handlers for images
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
  };

  // Drag handlers for documents
  const handleDocumentDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDocumentDragging(true);
  };

  const handleDocumentDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDocumentDragging(false);
  };

  const handleDocumentDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDocumentDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processDocumentFiles(files);
    }
  };

  // Helper component for field errors
  const FieldError = ({ error }: { error: string | null }) => {
    if (!error) return null;
    return (
      <p className="text-sm text-destructive flex items-center gap-1 mt-1">
        <AlertCircle className="w-3 h-3" />
        {error}
      </p>
    );
  };

  // Helper component for valid field indicator
  const FieldSuccess = ({ show }: { show: boolean }) => {
    if (!show) return null;
    return (
      <CheckCircle className="w-4 h-4 text-green-500 absolute right-3 top-1/2 -translate-y-1/2" />
    );
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched
    setTouched({
      name: true,
      species: true,
      breed: true,
      age: true,
      priceEstimate: true,
      stepsDescription: true,
      phoneNumber: true,
      email: true,
      redirectLink: true,
      redirectPhoneNumber: true,
      redirectEmail: true,
    });

    // Check for validation errors
    if (validateName(formData.name) || validateSpecies(formData.species) ||
      validateBreed(formData.breed) || validateAge(formData.age) ||
      validateSteps(adoptionDetails.stepsDescription)) {
      setError("Please fix the errors above before submitting.");
      return;
    }

    if (adoptionDetails.method === 'DIRECT' && (validatePhone(adoptionDetails.phoneNumber) || validateEmail(adoptionDetails.email))) {
      setError("Please fix the direct adoption contact details before submitting.");
      return;
    }

    if (adoptionDetails.method === 'REDIRECT' && (
      validateUrl(adoptionDetails.redirectLink)
      || validatePhone(adoptionDetails.redirectPhoneNumber)
      || validateEmail(adoptionDetails.redirectEmail)
    )) {
      setError("Please fix the website redirect contact details before submitting.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Update pet details
      const petPayload = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        age: formData.age,
        description: formData.description,
        atRisk: formData.atRisk,
        fosterable: formData.fosterable,
      };

      const response = await fetch(`${API_BASE_URL}/api/pets/${pet.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(petPayload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Pet update failed', { status: response.status, errorText });
        let detail = '';
        try {
          const parsed = JSON.parse(errorText);
          if (parsed.errors) {
            detail = Object.entries(parsed.errors).map(([k, v]) => `${k}: ${v}`).join(', ');
          } else if (parsed.message) {
            detail = parsed.message;
          }
        } catch { /* not JSON */ }
        throw new Error(detail || 'Unable to update the pet listing. Please check your information and try again.');
      }

      // 2. Update adoption details (try PUT, fall back to POST if not found)
      const adoptionPayload = {
        isDirect: adoptionDetails.method === 'DIRECT',
        priceEstimate: adoptionDetails.priceEstimate,
        stepsDescription: adoptionDetails.stepsDescription,
        phoneNumber: adoptionDetails.method === 'DIRECT'
          ? adoptionDetails.phoneNumber
          : adoptionDetails.method === 'REDIRECT'
            ? adoptionDetails.redirectPhoneNumber
            : null,
        email: adoptionDetails.method === 'DIRECT'
          ? adoptionDetails.email
          : adoptionDetails.method === 'REDIRECT'
            ? adoptionDetails.redirectEmail
            : null,
        redirectLink: adoptionDetails.method === 'REDIRECT' ? adoptionDetails.redirectLink : null,
      };

      let adoptionResponse = await fetch(`${API_BASE_URL}/api/pets/${pet.id}/adoption-details`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(adoptionPayload),
      });

      // If adoption details don't exist yet, create them with POST
      if (!adoptionResponse.ok && (adoptionResponse.status === 404 || adoptionResponse.status === 500)) {
        logger.info('Adoption details not found, creating new ones');
        adoptionResponse = await fetch(`${API_BASE_URL}/api/pets/${pet.id}/adoption-details`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify(adoptionPayload),
        });
      }

      if (!adoptionResponse.ok) {
        const errorText = await adoptionResponse.text();
        logger.error('Adoption details update failed', { status: adoptionResponse.status, errorText });
        throw new Error('Pet updated but unable to save adoption details.');
      }

      // 3. Delete removed images
      for (const imageId of imagesToDelete) {
        const deleteResponse = await fetch(`${API_BASE_URL}/api/pets/${pet.id}/images/${imageId}`, {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!deleteResponse.ok) {
          logger.error('Image delete failed', { imageId });
        }
      }

      // 4. Upload new images
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        const imageFormData = new FormData();
        imageFormData.append('file', file);
        imageFormData.append('altText', formData.name);

        const imageResponse = await fetch(
          `${API_BASE_URL}/api/pets/${pet.id}/upload-image`,
          {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: imageFormData,
          }
        );

        if (!imageResponse.ok) {
          throw new Error(`Failed to upload image ${i + 1}.`);
        }
      }

      // 5. Upload new documents
      for (let i = 0; i < selectedDocumentFiles.length; i++) {
        const file = selectedDocumentFiles[i];
        const documentFormData = new FormData();
        documentFormData.append('file', file);

        const documentResponse = await fetch(`${API_BASE_URL}/api/pets/${pet.id}/documents`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: documentFormData,
        });

        if (!documentResponse.ok) {
          throw new Error(`Failed to upload document ${i + 1}.`);
        }
      }

      // 6. Navigate back
      navigate('/profile/vendor');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page-alt">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Edit Pet Listing
            </h1>
            <Button asChild variant="outline">
              <Link to="/profile/vendor">← Back to Profile</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Edit Pet Details</CardTitle>
            <p className="text-sm text-muted-foreground">
              Update the details below. Fields marked with * are required.
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium text-red-800">Something went wrong</p>
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">
                  Pet Details
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <div className="relative">
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('name')}
                        required
                        placeholder="e.g., Max"
                        className={nameError ? "border-destructive" : ""}
                      />
                      <FieldSuccess show={touched.name && !nameError && !!formData.name} />
                    </div>
                    <FieldError error={nameError} />
                  </div>
                  <div>
                    <Label htmlFor="species">Species *</Label>
                    <div className="relative">
                      <Input
                        id="species"
                        name="species"
                        value={formData.species}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('species')}
                        required
                        placeholder="e.g., Dog"
                        className={speciesError ? "border-destructive" : ""}
                      />
                      <FieldSuccess show={touched.species && !speciesError && !!formData.species} />
                    </div>
                    <FieldError error={speciesError} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="breed">Breed *</Label>
                    <div className="relative">
                      <Input
                        id="breed"
                        name="breed"
                        value={formData.breed}
                        onChange={handleInputChange}
                        onBlur={() => handleBlur('breed')}
                        required
                        placeholder="e.g., Labrador"
                        className={breedError ? "border-destructive" : ""}
                      />
                      <FieldSuccess show={touched.breed && !breedError && !!formData.breed} />
                    </div>
                    <FieldError error={breedError} />
                  </div>
                  <div>
                    <Label htmlFor="age">Age (years) *</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      onBlur={() => handleBlur('age')}
                      required
                      min="0"
                      max="30"
                      className={ageError ? "border-destructive" : ""}
                    />
                    <FieldError error={ageError} />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell potential adopters about this pet's personality, habits, and what makes them special..."
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                    maxLength={1000}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {formData.description.length}/1000 characters
                  </p>
                </div>

                <div className="flex gap-6 p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="atRisk"
                      name="atRisk"
                      checked={formData.atRisk}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          atRisk: checked as boolean,
                        }))
                      }
                    />
                    <div>
                      <Label htmlFor="atRisk" className="cursor-pointer font-medium">
                        At Risk
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        This pet needs urgent placement
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="fosterable"
                      name="fosterable"
                      checked={formData.fosterable}
                      onCheckedChange={(checked) =>
                        setFormData((prev) => ({
                          ...prev,
                          fosterable: checked as boolean,
                        }))
                      }
                    />
                    <div>
                      <Label htmlFor="fosterable" className="cursor-pointer font-medium">
                        Available for Foster
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        Open to temporary foster homes
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Adoption Details */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">
                  Adoption Details
                </h3>

                <div>
                  <Label htmlFor="priceEstimate">Estimated Adoption Fee *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                    <Input
                      id="priceEstimate"
                      name="priceEstimate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={adoptionDetails.priceEstimate}
                      onChange={handleAdoptionDetailsChange}
                      onBlur={() => handleBlur('priceEstimate')}
                      required
                      placeholder="150.00"
                      className={`pl-7 ${priceError ? "border-destructive" : ""}`}
                    />
                  </div>
                  <FieldError error={priceError} />
                  <p className="text-xs text-muted-foreground mt-1">
                    This helps cover vaccinations, spay/neuter, and care costs
                  </p>
                </div>

                <div>
                  <Label htmlFor="stepsDescription">
                    Steps to Adopt *
                  </Label>
                  <textarea
                    id="stepsDescription"
                    name="stepsDescription"
                    value={adoptionDetails.stepsDescription}
                    onChange={handleAdoptionDetailsChange}
                    onBlur={() => handleBlur('stepsDescription')}
                    placeholder="Example:&#10;1. Fill out our adoption application&#10;2. Meet and greet with the pet&#10;3. Home visit (virtual or in-person)&#10;4. Sign adoption contract&#10;5. Take your new friend home!"
                    className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-ring ${stepsError ? "border-destructive" : "border-input"
                      }`}
                    rows={5}
                    required
                  />
                  <FieldError error={stepsError} />
                </div>

                <div className="space-y-4 border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleAdoptionTypeChange('DIRECT')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${adoptionDetails.method === 'DIRECT'
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      Direct Adoption
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdoptionTypeChange('REDIRECT')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${adoptionDetails.method === 'REDIRECT'
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      Redirect to Website
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdoptionTypeChange('ONLINE_FORM')}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${adoptionDetails.method === 'ONLINE_FORM'
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      PDF Form
                    </button>
                  </div>

                  {adoptionDetails.method === 'DIRECT' ? (
                    <div className="space-y-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Adopters will contact you directly at these details:
                      </p>
                      <div>
                        <Label htmlFor="phoneNumber">
                          Phone Number *
                        </Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          value={adoptionDetails.phoneNumber}
                          onChange={handleAdoptionDetailsChange}
                          onBlur={() => handleBlur('phoneNumber')}
                          required
                          placeholder="(555) 123-4567"
                          className={phoneError ? "border-destructive" : ""}
                        />
                        <FieldError error={phoneError} />
                      </div>
                      <div>
                        <Label htmlFor="email">
                          Email *
                        </Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={adoptionDetails.email}
                          onChange={handleAdoptionDetailsChange}
                          onBlur={() => handleBlur('email')}
                          required
                          placeholder="contact@example.com"
                          className={emailError ? "border-destructive" : ""}
                        />
                        <FieldError error={emailError} />
                      </div>
                    </div>
                  ) : adoptionDetails.method === 'REDIRECT' ? (
                    <div className="space-y-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">
                        Adopters will be redirected to your organization's website:
                      </p>
                      <div>
                        <Label htmlFor="redirectLink">
                          Adoption Page Link *
                        </Label>
                        <Input
                          id="redirectLink"
                          name="redirectLink"
                          type="url"
                          value={adoptionDetails.redirectLink}
                          onChange={handleAdoptionDetailsChange}
                          onBlur={() => handleBlur('redirectLink')}
                          required
                          placeholder="https://myorganization.com/adopt/pet123"
                          className={redirectLinkError ? "border-destructive" : ""}
                        />
                        <FieldError error={redirectLinkError} />
                      </div>
                      <div>
                        <Label htmlFor="redirectPhoneNumber">
                          Organization Phone *
                        </Label>
                        <Input
                          id="redirectPhoneNumber"
                          name="redirectPhoneNumber"
                          type="tel"
                          value={adoptionDetails.redirectPhoneNumber}
                          onChange={handleAdoptionDetailsChange}
                          onBlur={() => handleBlur('redirectPhoneNumber')}
                          required
                          placeholder="(555) 123-4567"
                          className={redirectPhoneError ? "border-destructive" : ""}
                        />
                        <FieldError error={redirectPhoneError} />
                      </div>
                      <div>
                        <Label htmlFor="redirectEmail">
                          Organization Email *
                        </Label>
                        <Input
                          id="redirectEmail"
                          name="redirectEmail"
                          type="email"
                          value={adoptionDetails.redirectEmail}
                          onChange={handleAdoptionDetailsChange}
                          onBlur={() => handleBlur('redirectEmail')}
                          required
                          placeholder="adoption@myorganization.com"
                          className={redirectEmailError ? "border-destructive" : ""}
                        />
                        <FieldError error={redirectEmailError} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4 border-t">
                      <div className="rounded-lg border border-primary/20 bg-primary/5 p-4">
                        <div className="flex items-start gap-3">
                          <FileText className="mt-0.5 h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-foreground">PDF form submission</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              Adopters will download your saved PDF form, fill it out, and upload it back from the pet page.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Pet Images */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">
                  Pet Images
                </h3>

                {/* Existing Images */}
                {existingImages.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Current Images</p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {existingImages.map((img: any) => (
                        <div key={img.id} className="relative group aspect-square">
                          <img
                            src={getImageUrl(img.filePath)}
                            alt={img.altText || 'Pet image'}
                            className="w-full h-full object-cover rounded-lg border shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => removeExistingImage(img.id)}
                            className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Drag and Drop Zone */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                    transition-all duration-200 ease-in-out
                    ${isDragging
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <input
                    ref={fileInputRef}
                    id="files"
                    name="files"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="hidden"
                    multiple
                  />

                  <div className="flex flex-col items-center gap-3">
                    <div className={`
                      p-4 rounded-full transition-colors
                      ${isDragging ? 'bg-primary/10' : 'bg-muted'}
                    `}>
                      <ImageIcon className={`
                        h-8 w-8 transition-colors
                        ${isDragging ? 'text-primary' : 'text-muted-foreground'}
                      `} />
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium">
                        {isDragging ? 'Drop your images here' : 'Drag and drop images here'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse • JPEG, PNG only • Max 5MB each
                      </p>
                    </div>
                  </div>
                </div>

                {/* New Image Previews */}
                {previewUrls.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {previewUrls.length} new image{previewUrls.length !== 1 ? 's' : ''} to upload
                    </p>
                    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                      {previewUrls.map((url, index) => (
                        <div key={index} className="relative group aspect-square">
                          <img
                            src={url}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-full object-cover rounded-lg border shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNewImage(index);
                            }}
                            className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Documents */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Additional Pet Documents</h3>
                <p className="text-sm text-muted-foreground">
                  Optional PDF documents such as medical records or vaccination paperwork can appear on the pet listing for download.
                </p>

                {/* Existing Documents */}
                {existingDocuments.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">Current Documents</p>
                    <div className="space-y-2">
                      {existingDocuments.map((doc: any) => (
                        <div key={doc.id} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <p className="font-medium text-sm">{doc.fileName || doc.name || 'Document'}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeExistingDocument(doc.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  onDragOver={handleDocumentDragOver}
                  onDragLeave={handleDocumentDragLeave}
                  onDrop={handleDocumentDrop}
                  onClick={() => documentInputRef.current?.click()}
                  className={`
                    relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
                    transition-all duration-200 ease-in-out
                    ${isDocumentDragging
                      ? 'border-primary bg-primary/5 scale-[1.02]'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                    }
                  `}
                >
                  <input
                    ref={documentInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleDocumentFileChange}
                    className="hidden"
                    multiple
                  />

                  <div className="flex flex-col items-center gap-3">
                    <div className={`p-4 rounded-full transition-colors ${isDocumentDragging ? 'bg-primary/10' : 'bg-muted'}`}>
                      <FileText className={`h-8 w-8 transition-colors ${isDocumentDragging ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>

                    <div className="space-y-1">
                      <p className="font-medium">
                        {isDocumentDragging ? 'Drop your documents here' : 'Drag and drop supporting documents here'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        or click to browse • PDF only • Max 10MB each
                      </p>
                    </div>
                  </div>
                </div>

                {selectedDocumentFiles.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {selectedDocumentFiles.length} new document{selectedDocumentFiles.length !== 1 ? 's' : ''} to upload
                    </p>
                    <div className="space-y-2">
                      {selectedDocumentFiles.map((file, index) => (
                        <div key={`${file.name}-${index}`} className="flex items-center justify-between rounded-lg border bg-muted/30 px-3 py-2">
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNewDocument(index);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/profile/vendor')}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
