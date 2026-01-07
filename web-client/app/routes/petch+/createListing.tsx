import { useState, useRef } from 'react';
import type { DragEvent } from 'react';
import { useNavigate, Link, useLoaderData, redirect } from 'react-router';
import type { Route } from './+types/createListing';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';
import { Progress } from '~/components/ui/progress';
import { getSession } from '~/services/session.server';
import { getUserFromSession } from '~/services/auth';
import {
  ImageIcon, X, AlertCircle, CheckCircle
} from 'lucide-react';
import { createLogger } from '~/utils/logger';

const logger = createLogger('CreateListing');

export function meta({ }: Route.MetaArgs) {
  return [
    { title: 'Create Pet Listing - Petch' },
    { name: 'description', content: 'Create a new pet listing' },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  if (!token || !user) {
    return redirect('/login?redirectTo=/pets/create');
  }

  return { token, user };
}

export default function CreatePetPage() {
  const { token, user } = useLoaderData<typeof loader>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: 0,
    description: '',
    atRisk: false,
    fosterable: false,
  });

  const [adoptionDetails, setAdoptionDetails] = useState({
    isDirect: true,
    priceEstimate: 0,
    stepsDescription: '',
    phoneNumber: '',
    email: user?.email || '',
    redirectLink: '',
    redirectPhoneNumber: '',
    redirectEmail: '',
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

  // Human-friendly validation functions
  const validateName = (name: string) => {
    if (!name) return "What's this pet's name?";
    if (name.length < 2) return "Name should be at least 2 characters";
    if (name.length > 100) return "Name is too long (max 100 characters)";
    return null;
  };

  const validateSpecies = (species: string) => {
    if (!species) return "What type of animal is this? (e.g., Dog, Cat, Bird)";
    if (species.length < 2) return "Please enter a valid species name";
    return null;
  };

  const validateBreed = (breed: string) => {
    if (!breed) return "What breed is this pet? (e.g., Labrador, Siamese)";
    if (breed.length < 2) return "Please enter a valid breed name";
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
  const phoneError = touched.phoneNumber && adoptionDetails.isDirect
    ? validatePhone(adoptionDetails.phoneNumber) : null;
  const emailError = touched.email && adoptionDetails.isDirect
    ? validateEmail(adoptionDetails.email) : null;
  const redirectLinkError = touched.redirectLink && !adoptionDetails.isDirect
    ? validateUrl(adoptionDetails.redirectLink) : null;
  const redirectPhoneError = touched.redirectPhoneNumber && !adoptionDetails.isDirect
    ? validatePhone(adoptionDetails.redirectPhoneNumber) : null;
  const redirectEmailError = touched.redirectEmail && !adoptionDetails.isDirect
    ? validateEmail(adoptionDetails.redirectEmail) : null;

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData((prev) => ({
        ...prev,
        [name]: (e.target as HTMLInputElement).checked,
      }));
    } else if (type === 'number') {
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

  const handleAdoptionTypeChange = (isDirect: boolean) => {
    setAdoptionDetails((prev) => ({
      ...prev,
      isDirect,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      processFiles(files);
      e.target.value = '';
    }
  };

  const removeImage = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => prev.filter((_, i) => i !== index));
  };

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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Mark all fields as touched to show any validation errors
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

    setLoading(true);
    setError(null);

    try {
      const userResponse = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Unable to verify your account. Please try logging in again.');
      }

      const fullUser = await userResponse.json();

      const petPayload = {
        name: formData.name,
        species: formData.species,
        breed: formData.breed,
        age: formData.age,
        description: formData.description,
        atRisk: formData.atRisk,
        fosterable: formData.fosterable,
        userId: fullUser.id,
      };

      const petResponse = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(petPayload),
      });

      if (!petResponse.ok) {
        const errorText = await petResponse.text();
        logger.error('Pet creation failed', { status: petResponse.status, errorText });
        throw new Error('Unable to create the pet listing. Please check your information and try again.');
      }

      const pet = await petResponse.json();

      if (selectedFiles.length > 0) {
        setUploadProgress(10);
        for (let i = 0; i < selectedFiles.length; i++) {
          const file = selectedFiles[i];
          const imageFormData = new FormData();
          imageFormData.append('file', file);
          imageFormData.append('altText', formData.name);

          const imageResponse = await fetch(
            `/api/pets/${pet.id}/upload-image`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
              body: imageFormData,
            }
          );

          if (!imageResponse.ok) {
            throw new Error(`Failed to upload image ${i + 1}. The pet was created but some images may be missing.`);
          }
          setUploadProgress(10 + ((i + 1) / selectedFiles.length) * 40);
        }
      }

      setUploadProgress(60);

      // Create adoption details
      const adoptionPayload = {
        isDirect: adoptionDetails.isDirect,
        priceEstimate: adoptionDetails.priceEstimate,
        stepsDescription: adoptionDetails.stepsDescription,
        phoneNumber: adoptionDetails.isDirect ? adoptionDetails.phoneNumber : adoptionDetails.redirectPhoneNumber,
        email: adoptionDetails.isDirect ? adoptionDetails.email : adoptionDetails.redirectEmail,
        redirectLink: adoptionDetails.isDirect ? null : adoptionDetails.redirectLink,
      };

      const adoptionResponse = await fetch(`/api/pets/${pet.id}/adoption-details`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(adoptionPayload),
      });

      if (!adoptionResponse.ok) {
        throw new Error('Pet created but unable to save adoption details. Please edit the listing to add them.');
      }

      setUploadProgress(100);
      navigate('/pets?refresh=' + Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
      setLoading(false);
      setUploadProgress(0);
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

  return (
    <div className="min-h-screen bg-page-alt">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold flex items-center gap-2">
              Create Pet Listing
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
            <CardTitle>Add a New Pet</CardTitle>
            <p className="text-sm text-muted-foreground">
              Fill in the details below to create a listing. Fields marked with * are required.
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
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    A good description helps pets find their forever homes faster!
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
                      onClick={() => handleAdoptionTypeChange(true)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${adoptionDetails.isDirect
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      Direct Adoption
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdoptionTypeChange(false)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${!adoptionDetails.isDirect
                        ? 'bg-primary text-white'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        }`}
                    >
                      Redirect to Website
                    </button>
                  </div>

                  {adoptionDetails.isDirect ? (
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
                  ) : (
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
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">
                  Pet Images
                </h3>

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

                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Image Previews */}
                {previewUrls.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      {previewUrls.length} image{previewUrls.length !== 1 ? 's' : ''} selected
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
                              removeImage(index);
                            }}
                            className="absolute -top-2 -right-2 bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                            title="Remove image"
                          >
                            <X className="h-4 w-4" />
                          </button>
                          {index === 0 && (
                            <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded">
                              Main
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-4 border-t pt-6">
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1"
                >
                  {loading ? 'Creating listing...' : 'Create Pet Listing'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/pets')}
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
