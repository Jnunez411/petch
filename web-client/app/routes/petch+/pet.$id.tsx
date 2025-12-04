import { useLoaderData } from "react-router";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";

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
  createdAt: string;
  updatedAt: string;
}

export async function clientLoader({ params }: { params: { id: string } }) {
  const response = await fetch(`/api/pets/${params.id}`);
  if(!response.ok){
    throw new Error("Pet not found");
  }
  return response.json();
}

export default function PetDetail(){
  const pet: Pet = useLoaderData() as Pet;
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const mainImage = pet.images?.[selectedImageIndex];

  // Helper to construct full image URL through backend
  const getImageUrl = (filePath: string) => {
    if (!filePath) return '';
    // If it's already a full URL, return as is
    if (filePath.startsWith('http')) return filePath;
    // Otherwise, route through the backend proxy
    return `http://localhost:8080${filePath}`;
  };

  return(
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <div className="mb-6">
          <a href="/pets" className="text-indigo-600 hover:text-indigo-800 font-medium">
            ← Back to Pets
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <Card className="overflow-hidden bg-white shadow-lg">
              {mainImage ? (
                <img
                  src={getImageUrl(mainImage.filePath)}
                  alt={mainImage.altText || pet.name}
                  className="w-full h-96 object-cover"
                />
              ) : (
                <div className="w-full h-96 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">No image available</span>
                </div>
              )}
            </Card>

            {/* Thumbnail Gallery */}
            {pet.images && pet.images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {pet.images.map((img, idx) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex
                        ? "border-indigo-600 shadow-md"
                        : "border-gray-300 hover:border-indigo-400"
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
              <h1 className="text-4xl font-bold text-gray-900 mb-2">{pet.name}</h1>
              <div className="flex gap-3 flex-wrap">
                <span className="inline-block bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full font-semibold">
                  {pet.species}
                </span>
                <span className="inline-block bg-blue-100 text-blue-800 px-4 py-2 rounded-full">
                  {pet.breed}
                </span>
                {pet.atRisk && (
                  <span className="inline-block bg-red-100 text-red-800 px-4 py-2 rounded-full font-semibold">
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
            <Card className="bg-white p-6 shadow-md">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-gray-500 text-sm font-medium">Age</p>
                  <p className="text-2xl font-bold text-gray-900">{pet.age} years old</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm font-medium">Status</p>
                  <p className="text-2xl font-bold text-green-600">Available</p>
                </div>
              </div>
            </Card>

            {/* Description */}
            <Card className="bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-3">About {pet.name}</h2>
              <p className="text-gray-700 leading-relaxed text-lg">
                {pet.description || "No description available for this pet."}
              </p>
            </Card>

            {/* Additional Info */}
            <Card className="bg-white p-6 shadow-md">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Pet Information</h2>
              <dl className="space-y-4">
                <div className="flex justify-between items-center border-b pb-3">
                  <dt className="text-gray-600 font-medium">Species</dt>
                  <dd className="text-gray-900 font-semibold">{pet.species}</dd>
                </div>
                <div className="flex justify-between items-center border-b pb-3">
                  <dt className="text-gray-600 font-medium">Breed</dt>
                  <dd className="text-gray-900 font-semibold">{pet.breed}</dd>
                </div>
                <div className="flex justify-between items-center border-b pb-3">
                  <dt className="text-gray-600 font-medium">Age</dt>
                  <dd className="text-gray-900 font-semibold">{pet.age} years</dd>
                </div>
                <div className="flex justify-between items-center border-b pb-3">
                  <dt className="text-gray-600 font-medium">At Risk</dt>
                  <dd className="text-gray-900 font-semibold">
                    {pet.atRisk ? "Yes" : "No"}
                  </dd>
                </div>
                <div className="flex justify-between items-center border-b pb-3">
                  <dt className="text-gray-600 font-medium">Fosterable</dt>
                  <dd className="text-gray-900 font-semibold">
                    {pet.fosterable ? "Yes" : "No"}
                  </dd>
                </div>
                {pet.user && (
                  <div className="flex justify-between items-center">
                    <dt className="text-gray-600 font-medium">Uploaded by</dt>
                    <dd className="text-gray-900 font-semibold">
                      {pet.user.firstName} {pet.user.lastName}
                    </dd>
                  </div>
                )}
              </dl>
            </Card>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white py-3 text-lg font-semibold">
                Adopt {pet.name}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
