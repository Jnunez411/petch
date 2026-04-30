package project.petch.petch_api.config;

import java.util.List;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import project.petch.petch_api.models.Images;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.dto.user.UserType;
import project.petch.petch_api.models.AdoptionDetails;
import project.petch.petch_api.repositories.PetsRepository;
import project.petch.petch_api.repositories.UserRepository;

@Configuration
@Slf4j
@Profile({ "dev", "demo", "default" })
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
                                log.info("Created demo adopter user: adopter@gmail.com / adopterpass");
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
                                log.info("Created demo vendor user: vendor@gmail.com / vendorpass");
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
                                log.info("Created admin user: admin@petch.com / adminpass123");
                        }

                        // Calculate how many more pets we need to add (don't delete existing — FK
                        // constraints may exist)
                        long existingCount = repository.count();
                        int petsToAdd = (int) (500 - existingCount);
                        if (petsToAdd <= 0) {
                                log.info("Database already has {} pets. Skipping seed.", existingCount);
                                return;
                        }
                        log.info("Database has {} pets. Adding {} more to reach 500.", existingCount, petsToAdd);

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

                        String[] dogImages = {
                                "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/1805164/pexels-photo-1805164.jpeg?auto=compress&w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/2253275/pexels-photo-2253275.jpeg?auto=compress&w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&w=800&h=800&fit=crop"
                        };

                        String[] catImages = {
                                "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/45201/kitty-cat-kitten-pet-45201.jpeg?auto=compress&w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/1170986/pexels-photo-1170986.jpeg?auto=compress&w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/2558605/pexels-photo-2558605.jpeg?auto=compress&w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1561948955-570b270e7c36?w=800&h=800&fit=crop"
                        };

                        String[] birdImages = {
                                "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/1661179/pexels-photo-1661179.jpeg?auto=compress&w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1444464666168-49d633b86797?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/56733/pexels-photo-56733.jpeg?auto=compress&w=800&h=800&fit=crop"
                        };

                        String[] rabbitImages = {
                                "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/4588065/pexels-photo-4588065.jpeg?auto=compress&w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/4001296/pexels-photo-4001296.jpeg?auto=compress&w=800&h=800&fit=crop"
                        };

                        String[] otherImages = {
                                "https://images.pexels.com/photos/1108341/pexels-photo-1108341.jpeg?auto=compress&w=800&h=800&fit=crop",
                                "https://images.pexels.com/photos/5169056/pexels-photo-5169056.jpeg?auto=compress&w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1597633425046-08f5110420b5?w=800&h=800&fit=crop",
                                "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&h=800&fit=crop"
                        };

                        java.util.Random random = new java.util.Random();
                        List<Pets> petsToSave = new java.util.ArrayList<>();

                        for (int i = 0; i < petsToAdd; i++) {
                                String name = names[random.nextInt(names.length)];
                                String species = speciesList[random.nextInt(speciesList.length)];
                                String breed;
                                String imageUrl;

                                switch (species) {
                                        case "Dog":
                                                breed = dogBreeds[random.nextInt(dogBreeds.length)];
                                                imageUrl = dogImages[random.nextInt(dogImages.length)];
                                                break;
                                        case "Cat":
                                                breed = catBreeds[random.nextInt(catBreeds.length)];
                                                imageUrl = catImages[random.nextInt(catImages.length)];
                                                break;
                                        case "Bird":
                                                breed = birdBreeds[random.nextInt(birdBreeds.length)];
                                                imageUrl = birdImages[random.nextInt(birdImages.length)];
                                                break;
                                        case "Rabbit":
                                                breed = rabbitBreeds[random.nextInt(rabbitBreeds.length)];
                                                imageUrl = rabbitImages[random.nextInt(rabbitImages.length)];
                                                break;
                                        default:
                                                breed = "Mixed";
                                                imageUrl = otherImages[random.nextInt(otherImages.length)];
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
                        log.info("Demo pets seeded successfully! Added {} pets.", petsToSave.size());
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
