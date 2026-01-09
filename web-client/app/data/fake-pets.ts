/**
 * Fake Pet Data for Development/Demo
 * 
 * This data simulates what would come from a shelter website scraper.
 * In production, this would be replaced with real API data.
 */

export interface FakePet {
    id: number;
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
}

// Pet image URLs from Unsplash (free, royalty-free)
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
        'https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800',
        'https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800',
        'https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=800',
        'https://images.unsplash.com/photo-1559253664-ca249d4608c6?w=800',
    ],
};

// Generate fake pets with variety
function generateFakePets(): FakePet[] {
    const pets: FakePet[] = [];
    let id = 1000; // Start with high IDs to avoid conflicts with real data

    // Dogs (8)
    const dogNames = ['Max', 'Buddy', 'Charlie', 'Cooper', 'Rocky', 'Bear', 'Duke', 'Tucker'];
    const dogBreeds = ['Golden Retriever', 'Labrador', 'German Shepherd', 'Beagle', 'Bulldog', 'Husky', 'Poodle', 'Corgi'];
    const dogDescriptions = [
        "A loyal and energetic companion who loves long walks and belly rubs. Great with kids and other dogs!",
        "Sweet and gentle soul looking for a forever home. Loves cuddles on the couch and playing fetch.",
        "Playful pup with endless energy! Needs an active family who enjoys outdoor adventures.",
        "Calm and well-trained buddy perfect for first-time dog owners. House-trained and knows basic commands.",
        "Goofy and lovable! Will make you laugh every day with silly antics. Gets along with everyone.",
        "Protective and smart companion. Very loyal to family and loves learning new tricks.",
        "Senior sweetheart looking for a quiet home. Loves slow walks and napping in sunny spots.",
        "Rescued from a tough situation but full of love to give. Just needs patience and kindness.",
    ];

    for (let i = 0; i < 8; i++) {
        pets.push({
            id: id++,
            name: dogNames[i],
            species: 'Dog',
            breed: dogBreeds[i],
            age: [1, 2, 3, 4, 5, 7, 9, 11][i],
            description: dogDescriptions[i],
            atRisk: i < 2, // Max and Buddy are at risk
            fosterable: i % 2 === 0,
            imageUrl: petImages.dog[i],
            priceEstimate: [150, 175, 200, 125, 150, 175, 100, 125][i],
            stepsDescription: "1. Submit adoption application\n2. Meet and greet\n3. Home check\n4. Finalize adoption",
        });
    }

    // Cats (8)
    const catNames = ['Luna', 'Milo', 'Oliver', 'Leo', 'Simba', 'Bella', 'Cleo', 'Shadow'];
    const catBreeds = ['Siamese', 'Persian', 'Maine Coon', 'Tabby', 'Ragdoll', 'British Shorthair', 'Bengal', 'Russian Blue'];
    const catDescriptions = [
        "Independent yet affectionate kitty who loves sunbathing by the window. Purrs like a motorboat!",
        "Playful and curious explorer. Will entertain you with acrobatic jumps and hunting skills.",
        "Lap cat extraordinaire! Loves nothing more than snuggling up during movie nights.",
        "Majestic and elegant feline with a calm demeanor. Perfect for a peaceful household.",
        "Chatty companion who will tell you all about their day. Very social and loves attention.",
        "Shy at first but blossoms into the sweetest cuddle buddy once comfortable.",
        "Mischievous troublemaker in the best way! Will keep you on your toes.",
        "Senior kitty with so much love left to give. Low maintenance and full of wisdom.",
    ];

    for (let i = 0; i < 8; i++) {
        pets.push({
            id: id++,
            name: catNames[i],
            species: 'Cat',
            breed: catBreeds[i],
            age: [1, 2, 3, 5, 6, 8, 10, 12][i],
            description: catDescriptions[i],
            atRisk: i < 2, // Luna and Milo are at risk
            fosterable: i % 2 === 1,
            imageUrl: petImages.cat[i],
            priceEstimate: [100, 125, 150, 100, 125, 100, 75, 75][i],
            stepsDescription: "1. Fill out application\n2. Phone interview\n3. Meet your new cat\n4. Take them home!",
        });
    }

    // Birds (4)
    const birdNames = ['Tweety', 'Sky', 'Sunny', 'Rio'];
    const birdBreeds = ['Parakeet', 'Cockatiel', 'African Grey', 'Canary'];
    const birdDescriptions = [
        "Cheerful singer who will brighten your mornings with beautiful melodies.",
        "Social and interactive feathered friend. Loves to whistle and mimic sounds.",
        "Colorful and playful companion. Enjoys toys and learning new tricks.",
        "Calm and gentle bird perfect for beginners. Easy to care for and delightful.",
    ];

    for (let i = 0; i < 4; i++) {
        pets.push({
            id: id++,
            name: birdNames[i],
            species: 'Bird',
            breed: birdBreeds[i],
            age: [1, 2, 4, 3][i],
            description: birdDescriptions[i],
            atRisk: i === 0,
            fosterable: i < 2,
            imageUrl: petImages.bird[i],
            priceEstimate: [50, 75, 150, 40][i],
            stepsDescription: "1. Learn about bird care\n2. Schedule a visit\n3. Complete application\n4. Welcome home!",
        });
    }

    // Rabbits (4)
    const rabbitNames = ['Thumper', 'Snowball', 'Oreo', 'Cinnamon'];
    const rabbitBreeds = ['Holland Lop', 'Dutch', 'Rex', 'Lionhead'];
    const rabbitDescriptions = [
        "Fluffy bundle of joy who loves hopping around and exploring. Very gentle with children.",
        "Curious and social bunny who enjoys being petted and playing with toys.",
        "Soft and cuddly friend perfect for a calm household. Loves fresh veggies!",
        "Energetic hopper who needs room to run. Will bring endless entertainment.",
    ];

    for (let i = 0; i < 4; i++) {
        pets.push({
            id: id++,
            name: rabbitNames[i],
            species: 'Rabbit',
            breed: rabbitBreeds[i],
            age: [1, 2, 3, 2][i],
            description: rabbitDescriptions[i],
            atRisk: i === 0,
            fosterable: i < 2,
            imageUrl: petImages.rabbit[i],
            priceEstimate: [60, 50, 45, 55][i],
            stepsDescription: "1. Research rabbit care\n2. Prepare a habitat\n3. Meet your bunny\n4. Adoption day!",
        });
    }

    // Other pets (4)
    const otherNames = ['Nibbles', 'Peanut', 'Shelly', 'Spike'];
    const otherSpecies = ['Hamster', 'Guinea Pig', 'Turtle', 'Hedgehog'];
    const otherBreeds = ['Syrian Hamster', 'American Guinea Pig', 'Red-Eared Slider', 'African Pygmy'];
    const otherDescriptions = [
        "Tiny but mighty! Active and entertaining pet that's perfect for small spaces.",
        "Sweet and gentle companion who loves being held and talked to. Very social!",
        "Low-maintenance friend who's fascinating to watch. Perfect for busy families.",
        "Unique and adorable pet looking for a special home. Easy to care for!",
    ];

    for (let i = 0; i < 4; i++) {
        pets.push({
            id: id++,
            name: otherNames[i],
            species: otherSpecies[i],
            breed: otherBreeds[i],
            age: [1, 2, 5, 1][i],
            description: otherDescriptions[i],
            atRisk: false,
            fosterable: true,
            imageUrl: petImages.other[i],
            priceEstimate: [25, 35, 40, 100][i],
            stepsDescription: "1. Learn about caring for this pet\n2. Prepare supplies\n3. Schedule pickup\n4. Enjoy!",
        });
    }

    // Sort: at-risk first, then by newest (highest ID)
    return pets.sort((a, b) => {
        if (a.atRisk && !b.atRisk) return -1;
        if (!a.atRisk && b.atRisk) return 1;
        return b.id - a.id;
    });
}

export const FAKE_PETS = generateFakePets();
export const PETS_PER_PAGE = 6;
