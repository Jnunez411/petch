package project.petch.petch_api.config;

import java.util.List;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import project.petch.petch_api.models.Images;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.dto.user.UserType;
import project.petch.petch_api.models.AdoptionDetails;
import project.petch.petch_api.repositories.PetsRepository;
import project.petch.petch_api.repositories.UserRepository;

@Configuration
public class DemoDataSeeder {

        @Bean
        CommandLineRunner initDatabase(PetsRepository repository, UserRepository userRepository,
                        PasswordEncoder passwordEncoder) {
                return args -> {
                        // Seed demo users if they don't exist
                        if (userRepository.findByEmail("adopter@gmail.com").isEmpty()) {
                                User adopter = new User();
                                adopter.setEmail("adopter@gmail.com");
                                adopter.setPasswordHash(passwordEncoder.encode("adopterpass"));
                                adopter.setFirstName("Demo");
                                adopter.setLastName("Adopter");
                                adopter.setUserType(UserType.ADOPTER);
                                adopter.setPhoneNumber("555-123-4567");
                                userRepository.save(adopter);
                                System.out.println("Created demo adopter user: adopter@gmail.com / adopterpass");
                        }

                        if (userRepository.findByEmail("vendor@gmail.com").isEmpty()) {
                                User vendor = new User();
                                vendor.setEmail("vendor@gmail.com");
                                vendor.setPasswordHash(passwordEncoder.encode("vendorpass"));
                                vendor.setFirstName("Demo");
                                vendor.setLastName("Vendor");
                                vendor.setUserType(UserType.VENDOR);
                                vendor.setPhoneNumber("555-987-6543");
                                userRepository.save(vendor);
                                System.out.println("Created demo vendor user: vendor@gmail.com / vendorpass");
                        }

                        if (userRepository.findByEmail("admin@petch.com").isEmpty()) {
                                User admin = new User();
                                admin.setEmail("admin@petch.com");
                                admin.setPasswordHash(passwordEncoder.encode("adminpass123"));
                                admin.setFirstName("System");
                                admin.setLastName("Administrator");
                                admin.setUserType(UserType.ADMIN);
                                admin.setPhoneNumber("555-000-0000");
                                userRepository.save(admin);
                                System.out.println("Created admin user: admin@petch.com / adminpass123");
                        }

                        if (repository.count() >= 200) {
                                System.out.println(
                                                "Database already has " + repository.count() + " pets. Skipping seed.");
                                return;
                        }

                        // Clear existing data to ensure we get exactly what we want if we're under 200
                        repository.deleteAll();

                        String[] names = {
                                        "Max", "Luna", "Buddy", "Bella", "Charlie", "Molly", "Rocky", "Lucy", "Cooper",
                                        "Daisy",
                                        "Duke", "Lola", "Bear", "Sadie", "Tucker", "Maggie", "Jack", "Sophie", "Bailey",
                                        "Chloe",
                                        "Zeus", "Lily", "Riley", "Ruby", "Buster", "Rosie", "Jake", "Zoey", "Harley",
                                        "Penny",
                                        "Toby", "Ginger", "Murphy", "Nala", "Leo", "Gracie", "Oscar", "Mia", "Winston",
                                        "Sasha",
                                        "Sam", "Abby", "Louie", "Roxie", "Koda", "Misty", "Gus", "Stella", "Jax", "Emma"
                        };

                        String[] dogBreeds = {
                                        "Golden Retriever", "Labrador", "French Bulldog", "German Shepherd", "Beagle",
                                        "Poodle", "Rottweiler", "Yorkshire Terrier", "Dachshund", "Boxer", "Husky"
                        };

                        String[] catBreeds = {
                                        "Siamese", "Persian", "Maine Coon", "Bengal", "Sphynx", "Ragdoll",
                                        "British Shorthair", "Abyssinian"
                        };

                        String[] birdBreeds = {
                                        "Parrot", "Cockatiel", "Canary", "Lovebird", "Finch", "Budgie"
                        };

                        String[] rabbitBreeds = {
                                        "Holland Lop", "Netherland Dwarf", "Mini Rex", "Lionhead", "Flemish Giant"
                        };

                        String[] speciesList = { "Dog", "Cat", "Bird", "Rabbit", "Other" };

                        java.util.Random random = new java.util.Random();
                        List<Pets> petsToSave = new java.util.ArrayList<>();

                        for (int i = 0; i < 200; i++) {
                                String name = names[random.nextInt(names.length)];
                                String species = speciesList[random.nextInt(speciesList.length)];
                                String breed;
                                String imageUrl;

                                switch (species) {
                                        case "Dog":
                                                breed = dogBreeds[random.nextInt(dogBreeds.length)];
                                                imageUrl = "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&sig="
                                                                + i;
                                                break;
                                        case "Cat":
                                                breed = catBreeds[random.nextInt(catBreeds.length)];
                                                imageUrl = "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&sig="
                                                                + i;
                                                break;
                                        case "Bird":
                                                breed = birdBreeds[random.nextInt(birdBreeds.length)];
                                                imageUrl = "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800&sig="
                                                                + i;
                                                break;
                                        case "Rabbit":
                                                breed = rabbitBreeds[random.nextInt(rabbitBreeds.length)];
                                                imageUrl = "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&sig="
                                                                + i;
                                                break;
                                        default:
                                                breed = "Mixed";
                                                imageUrl = "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&sig="
                                                                + i;
                                                break;
                                }

                                boolean atRisk = random.nextDouble() < 0.2; // 20% at risk
                                boolean fosterable = random.nextDouble() < 0.4; // 40% fosterable
                                int age = random.nextInt(15) + 1;
                                int price = (random.nextInt(45) + 5) * 10; // $50 to $500

                                // Random coordinates within USA approximate range
                                double lat = 25.0 + (49.0 - 25.0) * random.nextDouble();
                                double lng = -124.0 + (124.0 - 66.0) * random.nextDouble();

                                Pets pet = createPet(name, species, breed, age,
                                                "This lovely " + breed + " named " + name
                                                                + " is looking for a new family. " +
                                                                "Very friendly and healthy.",
                                                atRisk, fosterable, lat, lng, imageUrl, price);

                                petsToSave.add(pet);
                        }

                        repository.saveAll(petsToSave);
                        System.out.println("Demo pets seeded successfully! Added 200 pets.");
                };
        }

        private Pets createPet(String name, String species, String breed, int age, String description,
                        boolean atRisk, boolean fosterable, double lat, double lng,
                        String imageUrl, int price) {
                Pets pet = Pets.builder()
                                .name(name)
                                .species(species)
                                .breed(breed)
                                .age(age)
                                .description(description)
                                .atRisk(atRisk)
                                .fosterable(fosterable)
                                .latitude(lat)
                                .longitude(lng)
                                .build();

                // Create image with external URL
                Images image = Images.builder()
                                .fileName("pet_" + System.nanoTime() + ".jpg")
                                .filePath(imageUrl)
                                .altText(name + " - " + breed)
                                .fileSize(0L)
                                .pet(pet)
                                .build();

                pet.getImages().add(image);

                // Create adoption details
                AdoptionDetails adoptionDetails = AdoptionDetails.builder()
                                .priceEstimate((double) price)
                                .stepsDescription(
                                                "1. Initial application\n2. Home visit\n3. Meet and greet\n4. Adoption contract")
                                .email("adopt@petch.com")
                                .phoneNumber("555-" + (100 + new java.util.Random().nextInt(900)) + "-"
                                                + (1000 + new java.util.Random().nextInt(9000)))
                                .isDirect(true)
                                .pet(pet)
                                .build();

                pet.setAdoptionDetails(adoptionDetails);

                return pet;
        }
}
