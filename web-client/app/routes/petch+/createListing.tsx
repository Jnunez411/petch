import { useState, useRef } from 'react';
import type { DragEvent } from 'react';
import { Link, useLoaderData, redirect, useActionData, useNavigation, Form } from 'react-router';
import type { Route } from './+types/createListing';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Progress } from '~/components/ui/progress';
import { getSession } from '~/services/session.server';
import { getUserFromSession } from '~/services/auth';
import { authenticatedFetch } from '~/utils/api';
import { ImageIcon, X } from 'lucide-react';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8080';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Create Pet Listing - Petch' },
    { name: 'description', content: 'Create a new pet listing' },
  ];
}

// Loader to check authentication and verify user is a VENDOR
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  // Redirect to login if not authenticated
  if (!token || !user) {
    return redirect('/login?redirectTo=/pets/create');
  }

  // Only VENDOR users can create pet listings
  if (user.userType !== 'VENDOR') {
    return redirect('/pets?error=only-vendors-can-create-listings');
  }

  // Only return user info (not token) to the client
  return { user };
}

// Server action to handle pet creation securely
export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();

  // Get form values
  const name = formData.get('name') as string;
  const species = formData.get('species') as string;
  const breed = formData.get('breed') as string;
  const age = parseInt(formData.get('age') as string) || 0;
  const description = formData.get('description') as string || '';
  const atRisk = formData.get('atRisk') === 'on';
  const fosterable = formData.get('fosterable') === 'on';
  const imageFile = formData.get('petImage') as File | null;

  // Validation
  if (!name || !species || !breed) {
    return { error: 'Name, species, and breed are required' };
  }

  try {
    // Get user ID from backend
    const userResponse = await authenticatedFetch(request, '/api/users/me');
    if (!userResponse.ok) {
      return { error: 'Failed to get user data' };
    }
    const fullUser = await userResponse.json();

    // Create the pet
    const petResponse = await authenticatedFetch(request, '/api/pets', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        species,
        breed,
        age,
        description,
        atRisk,
        fosterable,
        userId: fullUser.id,
      }),
    });

    if (!petResponse.ok) {
      const errorText = await petResponse.text();
      return { error: `Failed to create pet: ${errorText}` };
    }

    const pet = await petResponse.json();

    // Upload image if provided
    if (imageFile && imageFile.size > 0) {
      const session = await getSession(request.headers.get('Cookie'));
      const token = session.get('token');

      const imageFormData = new FormData();
      imageFormData.append('file', imageFile);
      imageFormData.append('altText', name);

      const imageResponse = await fetch(
        `${API_BASE_URL}/api/pets/${pet.id}/upload-image`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
          body: imageFormData,
        }
      );

      if (!imageResponse.ok) {
        // Pet was created but image failed - still redirect, but could log error
        console.error('Failed to upload image:', imageResponse.status);
      }
    }

    // Redirect to pets page on success
    return redirect('/pets?created=true');
  } catch (error) {
    console.error('Error creating pet:', error);
    return { error: error instanceof Error ? error.message : 'An error occurred' };
  }
}

export default function CreatePetPage() {
  const { user } = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validImageTypes = ['image/jpeg', 'image/png', 'image/jpg'];

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    if (validImageTypes.includes(file.type)) {
      setSelectedFile(file);
      setFileError(null);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);

      // Simulate upload progress for visual feedback
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 10;
        });
      }, 100);
    } else {
      setFileError('Please upload a JPEG or PNG image only.');
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFile(e.target.files?.[0]);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  const resetFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Display error from action or file error
  const displayError = actionData?.error || fileError;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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

      {/* Form */}
      <div className="container mx-auto px-4 py-12 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Add a New Pet</CardTitle>
          </CardHeader>
          <CardContent>
            {displayError && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
                {displayError}
              </div>
            )}

            <Form method="post" encType="multipart/form-data" className="space-y-6">
              {/* Pet Details */}
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Pet Details</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      name="name"
                      required
                      placeholder="e.g., Max"
                    />
                  </div>
                  <div>
                    <Label htmlFor="species">Species *</Label>
                    <Input
                      id="species"
                      name="species"
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
                      required
                      min="0"
                      max="30"
                      defaultValue="0"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <textarea
                    id="description"
                    name="description"
                    placeholder="Tell us about this pet..."
                    className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                    rows={4}
                  />
                </div>

                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="atRisk"
                      name="atRisk"
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="atRisk" className="cursor-pointer">
                      At Risk
                    </Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="fosterable"
                      name="fosterable"
                      className="h-4 w-4 rounded border-input"
                    />
                    <Label htmlFor="fosterable" className="cursor-pointer">
                      Available for Foster
                    </Label>
                  </div>
                </div>
              </div>

              {/* Hidden file input for Form submission */}
              {selectedFile && (
                <input type="hidden" name="hasImage" value="true" />
              )}

              {/* Image Upload - Drag & Drop */}
              <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Pet Image</h3>
                
                {/* Drag & Drop Zone */}
                <div
                  className={`flex justify-center rounded-md border-2 border-dashed px-6 py-12 transition-colors ${
                    isDragging 
                      ? 'border-primary bg-primary/5' 
                      : 'border-input hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="text-center">
                    <ImageIcon
                      className="mx-auto h-12 w-12 text-muted-foreground"
                      aria-hidden={true}
                    />
                    <div className="flex text-sm leading-6 text-muted-foreground mt-4">
                      <p>Drag and drop or</p>
                      <label
                        htmlFor="pet-image-upload"
                        className="relative cursor-pointer rounded-sm pl-1 font-medium text-primary hover:underline hover:underline-offset-4"
                      >
                        <span>choose file</span>
                        <input
                          id="pet-image-upload"
                          name="petImage"
                          type="file"
                          className="sr-only"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          onChange={handleFileChange}
                          ref={fileInputRef}
                        />
                      </label>
                      <p className="pl-1">to upload</p>
                    </div>
                  </div>
                </div>

                <p className="text-xs leading-5 text-muted-foreground sm:flex sm:items-center sm:justify-between">
                  <span>Accepted file types: JPEG or PNG images only.</span>
                  <span className="pl-1 sm:pl-0">Max. size: 10MB</span>
                </p>

                {/* File Preview Card */}
                {selectedFile && (
                  <Card className="relative bg-muted p-4">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-1 top-1 h-8 w-8 text-muted-foreground hover:text-foreground"
                      aria-label="Remove"
                      onClick={resetFile}
                    >
                      <X className="h-5 w-5 shrink-0" aria-hidden={true} />
                    </Button>

                    <div className="flex items-center space-x-4">
                      {previewUrl && (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="h-16 w-16 rounded-md object-cover border"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {selectedFile.name}
                        </p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          {formatFileSize(selectedFile.size)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 mt-4">
                      <Progress value={uploadProgress} className="h-1.5" />
                      <span className="text-xs text-muted-foreground">{uploadProgress}%</span>
                    </div>
                  </Card>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-4 border-t pt-6">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1"
                >
                  {isSubmitting ? 'Creating...' : 'Create Pet Listing'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  asChild
                  disabled={isSubmitting}
                >
                  <Link to="/pets">Cancel</Link>
                </Button>
              </div>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}