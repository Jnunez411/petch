import { useState } from 'react';
import { useNavigate, Link, useLoaderData, redirect } from 'react-router';
import type { Route } from './+types/createListing';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { Label } from '~/components/ui/label';
import { Checkbox } from '~/components/ui/checkbox';
import { getSession } from '~/services/session.server';
import { getUserFromSession } from '~/services/auth';

export function meta({}: Route.MetaArgs) {
  return [
    { title: 'Create Pet Listing - Petch' },
    { name: 'description', content: 'Create a new pet listing' },
  ];
}

// Loader to check authentication and get token
export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');
  const user = await getUserFromSession(request);

  // Redirect to login if not authenticated
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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    species: '',
    breed: '',
    age: 0,
    description: '',
    atRisk: false,
    fosterable: false,
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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        setError('Please upload a JPEG or PNG image');
        return;
      }
      
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Get full user data (including ID) from backend
      const userResponse = await fetch('/api/users/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user data');
      }

      const fullUser = await userResponse.json();

      // Step 1: Create the pet
      const petResponse = await fetch('/api/pets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: formData.name,
          species: formData.species,
          breed: formData.breed,
          age: formData.age,
          description: formData.description,
          atRisk: formData.atRisk,
          fosterable: formData.fosterable,
          userId: fullUser.id,
        }),
      });

      if (!petResponse.ok) {
        throw new Error(`Failed to create pet: ${petResponse.status}`);
      }

      const pet = await petResponse.json();

      // Step 2: Upload image if selected
      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append('file', selectedFile);
        imageFormData.append('altText', formData.name); // Use pet name as alt text

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
          throw new Error(`Failed to upload image: ${imageResponse.status}`);
        }
      }

      // Redirect back to pets page with cache-busting query param to force reload
      navigate('/pets?refresh=' + Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold">Create Pet Listing</h1>
            <Button asChild variant="outline">
              <Link to="/pets">← Back to Pets</Link>
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
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded text-red-800">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Pet Details */}
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

              {/* Image Upload */}
              { <div className="space-y-4 border-t pt-6">
                <h3 className="font-semibold text-lg">Pet Image</h3>
                <div>
                  <Label htmlFor="file">Upload Image (JPEG or PNG only)</Label>
                  <Input
                    id="file"
                    name="file"
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    onChange={handleFileChange}
                    className="cursor-pointer"
                  />
                </div>

                {previewUrl && (
                  <div>
                    <p className="text-sm font-medium mb-2">Preview:</p>
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-w-xs rounded border"
                    />
                  </div>
                )}
              </div> }

              {/* Buttons */}
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
