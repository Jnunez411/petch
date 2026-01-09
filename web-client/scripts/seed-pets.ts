/**
 * Pet Data Seeding Script
 * 
 * This script generates fake pet data with real images from free sources.
 * It creates diverse pets for testing the pet listings page with filters.
 * 
 * Usage: npx ts-node scripts/seed-pets.ts
 * Or: bun run scripts/seed-pets.ts
 */

// Pet image URLs from free sources (Unsplash)
const petImages = {
    dog: [
        'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800',
        'https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800',
        'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800',
        'https://images.unsplash.com/photo-1534361960057-19889db9621e?w=800',
        'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=800',
        'https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=800',
        'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800',
        'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800',
    ],
    cat: [
        'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800',
        'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800',
        'https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800',
        'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?w=800',
        'https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800',
        'https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800',
        'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=800',
        'https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=800',
    ],
    bird: [
        'https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800',
        'https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800',
        'https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=800',
        'https://images.unsplash.com/photo-1480044965905-02098d419e96?w=800',
    ],
    rabbit: [
        'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800',
        'https://images.unsplash.com/photo-1535241749838-299c2eb98f72?w=800',
        'https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=800',
        'https://images.unsplash.com/photo-1589933767411-38a58367efd7?w=800',
    ],
    other: [
        'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800', // hamster
        'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800', // guinea pig
        'https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=800', // turtle
        'https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=800', // hedgehog
    ],
};

// Pet names by species
const petNames = {
    dog: ['Max', 'Buddy', 'Charlie', 'Cooper', 'Rocky', 'Bear', 'Duke', 'Tucker'],
    cat: ['Luna', 'Milo', 'Oliver', 'Leo', 'Simba', 'Bella', 'Cleo', 'Shadow'],
    bird: ['Tweety', 'Sky', 'Sunny', 'Rio'],
    rabbit: ['Thumper', 'Snowball', 'Oreo', 'Cinnamon'],
    other: ['Nibbles', 'Peanut', 'Shelly', 'Spike'],
};

// Breeds by species
const breeds = {
    dog: ['Golden Retriever', 'Labrador', 'German Shepherd', 'Beagle', 'Bulldog', 'Husky', 'Poodle', 'Corgi'],
    cat: ['Siamese', 'Persian', 'Maine Coon', 'Tabby', 'Ragdoll', 'British Shorthair', 'Bengal', 'Russian Blue'],
    bird: ['Parakeet', 'Cockatiel', 'African Grey', 'Canary'],
    rabbit: ['Holland Lop', 'Dutch', 'Rex', 'Lionhead'],
    other: ['Syrian Hamster', 'American Guinea Pig', 'Red-Eared Slider', 'African Pygmy'],
};

// Descriptions with personality
const descriptions = {
    dog: [
        "A loyal and energetic companion who loves long walks and belly rubs. Great with kids and other dogs!",
        "Sweet and gentle soul looking for a forever home. Loves cuddles on the couch and playing fetch in the yard.",
        "Playful pup with endless energy! Needs an active family who enjoys outdoor adventures.",
        "Calm and well-trained buddy perfect for first-time dog owners. House-trained and knows basic commands.",
        "Goofy and lovable! Will make you laugh every day with silly antics. Gets along great with everyone.",
        "Protective and smart companion. Very loyal to family and loves learning new tricks.",
        "Senior sweetheart looking for a quiet home. Loves slow walks and napping in sunny spots.",
        "Rescued from a tough situation but full of love to give. Just needs patience and kindness.",
    ],
    cat: [
        "Independent yet affectionate kitty who loves sunbathing by the window. Purrs like a motorboat!",
        "Playful and curious explorer. Will entertain you with acrobatic jumps and hunting skills.",
        "Lap cat extraordinaire! Loves nothing more than snuggling up during movie nights.",
        "Majestic and elegant feline with a calm demeanor. Perfect for a peaceful household.",
        "Chatty companion who will tell you all about their day. Very social and loves attention.",
        "Shy at first but blossoms into the sweetest cuddle buddy once comfortable.",
        "Mischievous troublemaker in the best way! Will keep you on your toes and your heart full.",
        "Senior kitty with so much love left to give. Low maintenance and full of wisdom.",
    ],
    bird: [
        "Cheerful singer who will brighten your mornings with beautiful melodies.",
        "Social and interactive feathered friend. Loves to whistle and mimic sounds.",
        "Colorful and playful companion. Enjoys toys and learning new tricks.",
        "Calm and gentle bird perfect for beginners. Easy to care for and delightful to watch.",
    ],
    rabbit: [
        "Fluffy bundle of joy who loves hopping around and exploring. Very gentle with children.",
        "Curious and social bunny who enjoys being petted and playing with toys.",
        "Soft and cuddly friend perfect for a calm household. Loves fresh veggies!",
        "Energetic hopper who needs room to run. Will bring endless entertainment to your home.",
    ],
    other: [
        "Tiny but mighty! Active and entertaining pet that's perfect for small spaces.",
        "Sweet and gentle companion who loves being held and talked to.",
        "Low-maintenance friend who's fascinating to watch. Perfect for busy families.",
        "Unique and adorable pet looking for a special home. Easy to care for!",
    ],
};

// Adoption steps templates
const adoptionSteps = [
    "1. Fill out our adoption application\n2. Meet and greet with your potential pet\n3. Home check (virtual or in-person)\n4. Adoption contract signing\n5. Take your new friend home!",
    "1. Submit application online\n2. Phone interview with our team\n3. In-person meeting with the pet\n4. Trial period (3-7 days)\n5. Finalize adoption paperwork",
    "1. Browse available pets\n2. Schedule a visit\n3. Complete adoption application\n4. Veterinary reference check\n5. Welcome your new family member!",
];

interface PetData {
    name: string;
    species: string;
    breed: string;
    age: number;
    description: string;
    atRisk: boolean;
    fosterable: boolean;
    imageUrl: string;
    priceEstimate: number;
    stepsDescription: string;
    featured: boolean; // For first page priority
}

function generatePets(): PetData[] {
    const pets: PetData[] = [];
    const speciesTypes = ['dog', 'cat', 'bird', 'rabbit', 'other'] as const;

    // Generate 8 dogs
    for (let i = 0; i < 8; i++) {
        pets.push({
            name: petNames.dog[i],
            species: 'Dog',
            breed: breeds.dog[i],
            age: Math.floor(Math.random() * 12) + 1,
            description: descriptions.dog[i],
            atRisk: i < 2, // First 2 dogs are at risk
            fosterable: i % 2 === 0, // Every other dog is fosterable
            imageUrl: petImages.dog[i],
            priceEstimate: Math.floor(Math.random() * 200) + 100,
            stepsDescription: adoptionSteps[i % 3],
            featured: i < 3, // First 3 dogs are featured
        });
    }

    // Generate 8 cats
    for (let i = 0; i < 8; i++) {
        pets.push({
            name: petNames.cat[i],
            species: 'Cat',
            breed: breeds.cat[i],
            age: Math.floor(Math.random() * 15) + 1,
            description: descriptions.cat[i],
            atRisk: i < 2,
            fosterable: i % 2 === 1,
            imageUrl: petImages.cat[i],
            priceEstimate: Math.floor(Math.random() * 150) + 75,
            stepsDescription: adoptionSteps[i % 3],
            featured: i < 2,
        });
    }

    // Generate 4 birds
    for (let i = 0; i < 4; i++) {
        pets.push({
            name: petNames.bird[i],
            species: 'Bird',
            breed: breeds.bird[i],
            age: Math.floor(Math.random() * 8) + 1,
            description: descriptions.bird[i],
            atRisk: i === 0,
            fosterable: i < 2,
            imageUrl: petImages.bird[i],
            priceEstimate: Math.floor(Math.random() * 100) + 50,
            stepsDescription: adoptionSteps[i % 3],
            featured: i === 0,
        });
    }

    // Generate 4 rabbits
    for (let i = 0; i < 4; i++) {
        pets.push({
            name: petNames.rabbit[i],
            species: 'Rabbit',
            breed: breeds.rabbit[i],
            age: Math.floor(Math.random() * 6) + 1,
            description: descriptions.rabbit[i],
            atRisk: i === 0,
            fosterable: i < 2,
            imageUrl: petImages.rabbit[i],
            priceEstimate: Math.floor(Math.random() * 80) + 40,
            stepsDescription: adoptionSteps[i % 3],
            featured: false,
        });
    }

    // Generate 4 other pets
    for (let i = 0; i < 4; i++) {
        const otherSpecies = ['Hamster', 'Guinea Pig', 'Turtle', 'Hedgehog'];
        pets.push({
            name: petNames.other[i],
            species: otherSpecies[i],
            breed: breeds.other[i],
            age: Math.floor(Math.random() * 4) + 1,
            description: descriptions.other[i],
            atRisk: false,
            fosterable: true,
            imageUrl: petImages.other[i],
            priceEstimate: Math.floor(Math.random() * 60) + 30,
            stepsDescription: adoptionSteps[i % 3],
            featured: false,
        });
    }

    return pets;
}

// Export for use in seeding
export const fakePets = generatePets();

// Sort so featured (at risk + fosterable) pets appear first
export const sortedPets = [...fakePets].sort((a, b) => {
    // Priority: atRisk first, then fosterable, then featured
    if (a.atRisk && !b.atRisk) return -1;
    if (!a.atRisk && b.atRisk) return 1;
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return 0;
});

console.log(`Generated ${fakePets.length} fake pets`);
console.log('Species distribution:');
console.log('- Dogs:', fakePets.filter(p => p.species === 'Dog').length);
console.log('- Cats:', fakePets.filter(p => p.species === 'Cat').length);
console.log('- Birds:', fakePets.filter(p => p.species === 'Bird').length);
console.log('- Rabbits:', fakePets.filter(p => p.species === 'Rabbit').length);
console.log('- Other:', fakePets.filter(p => !['Dog', 'Cat', 'Bird', 'Rabbit'].includes(p.species)).length);
console.log('\nFlags:');
console.log('- At Risk:', fakePets.filter(p => p.atRisk).length);
console.log('- Fosterable:', fakePets.filter(p => p.fosterable).length);
console.log('- Featured:', fakePets.filter(p => p.featured).length);
