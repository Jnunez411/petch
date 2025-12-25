import { useLoaderData, Link, redirect } from "react-router";
import type { Route } from "./+types/pet.$id";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { getUserFromSession } from "~/services/auth";
import { getSession } from "~/services/session.server";
import { FAKE_PETS, type FakePet } from '~/data/fake-pets';

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:8080';

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

interface Pet {
  id: number;
  name: string;
  species: string;
  breed: string;
  age: number;
  description: string;
  atRisk: boolean;
  fosterable: boolean;
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
    return { pet: mappedPet, apiBaseUrl: '' };
  }

  const session = await getSession(request.headers.get('Cookie'));
  const token = session.get('token');

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
    return { pet, apiBaseUrl: API_BASE_URL };
  } catch (error) {
    throw new Response("Pet not found", { status: 404 });
  }
}

export default function PetDetail() {
  const { pet, apiBaseUrl } = useLoaderData<typeof loader>();
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showAdoptionDetails, setShowAdoptionDetails] = useState(false);

  const mainImage = pet.images?.[selectedImageIndex];

  const getImageUrl = (filePath: string) => {
    if (!filePath) return '';
    if (filePath.startsWith('http')) return filePath;
    return `${apiBaseUrl}${filePath}`;
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <Link to="/pets" className="text-primary hover:text-primary/80 font-medium">
            ← Back to Pets
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
                <div className="w-full h-96 bg-muted flex items-center justify-center">
                  <span className="text-muted-foreground">No image available</span>
                </div>
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
                        ? "border-primary shadow-md"
                        : "border-muted hover:border-primary/50"
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
                <span className="inline-block bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-semibold">
                  {pet.species}
                </span>
                <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
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
                {pet.user && (
                  <div className="flex justify-between items-center">
                    <dt className="text-muted-foreground font-medium">Uploaded by</dt>
                    <dd className="text-foreground font-semibold">
                      {pet.user.firstName} {pet.user.lastName}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button
                onClick={() => setShowAdoptionDetails(!showAdoptionDetails)}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white py-3 text-lg font-semibold"
              >
                {showAdoptionDetails ? 'Hide Adoption Details' : 'View Adoption Details'}
              </Button>
            </div>

            {/* Adoption Details */}
            {showAdoptionDetails && pet.adoptionDetails && (
              <Card className="bg-card p-6 shadow-md border-2 border-orange-500">
                <h2 className="text-2xl font-bold text-foreground mb-4">Adoption Details</h2>

                <div className="space-y-4">
                  {/* Cost */}
                  <div className="border-b border-border pb-4">
                    <p className="text-muted-foreground text-sm font-medium">Estimated Adoption Cost</p>
                    <p className="text-2xl font-bold text-orange-600">${pet.adoptionDetails.priceEstimate?.toFixed(2) || '0.00'}</p>
                  </div>

                  {/* Steps Description */}
                  <div className="border-b border-border pb-4">
                    <p className="text-muted-foreground text-sm font-medium mb-2">Adoption Process</p>
                    <p className="text-foreground leading-relaxed">
                      {pet.adoptionDetails.stepsDescription || 'No process description available'}
                    </p>
                  </div>

                  {/* Direct vs Redirect */}
                  {pet.adoptionDetails.isDirect ? (
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
    </div>
  );
}
