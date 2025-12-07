import { useState, useEffect, useRef } from 'react';
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
import { ImageIcon, X } from 'lucide-react';

export function meta({}: Route.MetaArgs) {
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
        setError('Please upload only JPEG or PNG images');
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
    setLoading(true);
    setError(null);

    try {
      const userResponse = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user data');
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

      if(!petResponse.ok){
        const errorText = await petResponse.text();
        console.error('Pet creation error response:', errorText);
        throw new Error(`Failed to create pet: ${petResponse.status}`);
      }

      const pet = await petResponse.json();

      if(selectedFiles.length > 0){
        for(const file of selectedFiles){
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

          if(!imageResponse.ok){
            throw new Error(`Failed to upload image: ${imageResponse.status}`);
          }
        }
      }

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

      if(!adoptionResponse.ok){
        throw new Error(`Failed to create adoption details: ${adoptionResponse.status}`);
      }

      navigate('/pets?refresh=' + Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Create Pet Listing</h1>
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
          </CardHeader>
          <CardContent>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Pet Details</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Max"
                    />
                  </div>
                  <div>
                    <Label htmlFor="species">Species *</Label>
                    <Input
                      id="species"
                      name="species"
                      value={formData.species}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Dog"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="breed">Breed *</Label>
                    <Input
                      id="breed"
                      name="breed"
                      value={formData.breed}
                      onChange={handleInputChange}
                      required
                      placeholder="e.g., Labrador"
                    />
                  </div>
                  <div>
                    <Label htmlFor="age">Age (years) *</Label>
                    <Input
                      id="age"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      required
                      min="0"
                      max="30"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Tell us about this pet..."
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
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
                    <Label htmlFor="atRisk" className="cursor-pointer">
                      At Risk
                    </Label>
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
                    <Label htmlFor="fosterable" className="cursor-pointer">
                      Available for Foster
                    </Label>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Adoption Details</h3>

                <div>
                  <Label htmlFor="priceEstimate">Estimated Adoption Cost $ *</Label>
                  <Input
                    id="priceEstimate"
                    name="priceEstimate"
                    type="number"
                    step="0.01"
                    min="0"
                    value={adoptionDetails.priceEstimate}
                    onChange={handleAdoptionDetailsChange}
                    required
                    placeholder="e.g., 150.00"
                  />
                </div>

                <div>
                  <Label htmlFor="stepsDescription">Steps to Adopt *</Label>
                  <textarea
                    id="stepsDescription"
                    name="stepsDescription"
                    value={adoptionDetails.stepsDescription}
                    onChange={handleAdoptionDetailsChange}
                    placeholder="Describe the adoption process (e.g., application, interview, home visit)..."
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                    required
                  />
                </div>

                <div className="space-y-4 border rounded-lg p-4 bg-card">
                  <div className="flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={() => handleAdoptionTypeChange(true)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        adoptionDetails.isDirect
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Direct Adoption
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdoptionTypeChange(false)}
                      className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                        !adoptionDetails.isDirect
                          ? 'bg-orange-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      Redirect to Website
                    </button>
                  </div>

                  {adoptionDetails.isDirect ? (
                    <div className="space-y-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Contact information for direct adoption inquiries:</p>
                      <div>
                        <Label htmlFor="phoneNumber">Phone Number *</Label>
                        <Input
                          id="phoneNumber"
                          name="phoneNumber"
                          type="tel"
                          value={adoptionDetails.phoneNumber}
                          onChange={handleAdoptionDetailsChange}
                          required
                          placeholder="e.g., (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={adoptionDetails.email}
                          onChange={handleAdoptionDetailsChange}
                          required
                          placeholder="e.g., contact@example.com"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 pt-4 border-t">
                      <p className="text-sm text-muted-foreground">Redirect users to your company website for adoption:</p>
                      <div>
                        <Label htmlFor="redirectLink">Adoption Page Link *</Label>
                        <Input
                          id="redirectLink"
                          name="redirectLink"
                          type="url"
                          value={adoptionDetails.redirectLink}
                          onChange={handleAdoptionDetailsChange}
                          required
                          placeholder="e.g., https://mycompany.com/adopt/pet123"
                        />
                      </div>
                      <div>
                        <Label htmlFor="redirectPhoneNumber">Company Phone Number *</Label>
                        <Input
                          id="redirectPhoneNumber"
                          name="redirectPhoneNumber"
                          type="tel"
                          value={adoptionDetails.redirectPhoneNumber}
                          onChange={handleAdoptionDetailsChange}
                          required
                          placeholder="e.g., (555) 123-4567"
                        />
                      </div>
                      <div>
                        <Label htmlFor="redirectEmail">Company Email *</Label>
                        <Input
                          id="redirectEmail"
                          name="redirectEmail"
                          type="email"
                          value={adoptionDetails.redirectEmail}
                          onChange={handleAdoptionDetailsChange}
                          required
                          placeholder="e.g., adoption@mycompany.com"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Pet Images</h3>
                
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
                        or click to browse • JPEG, PNG only
                      </p>
                    </div>
                  </div>
                </div>

                {/* Upload Progress */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="h-2" />
                  </div>
                )}

                {/* Image Previews */}
                {previewUrls.length > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-medium">
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
                  {loading ? 'Creating...' : 'Create Pet Listing'}
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
