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
				// Golden retriever puppy
				"https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=800&h=800&fit=crop",
				// Corgi
				"https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=800&h=800&fit=crop",
				// Pug face
				"https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&h=800&fit=crop",
				// Happy golden retriever
				"https://images.unsplash.com/photo-1552053831-71594a27632d?w=800&h=800&fit=crop",
				// White fluffy dog
				"https://images.unsplash.com/photo-1587402092301-725e37c70fd8?w=800&h=800&fit=crop",
				// Brown lab puppy
				"https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=800&h=800&fit=crop",
				// Husky
				"https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=800&h=800&fit=crop",
				// Beagle
				"https://images.unsplash.com/photo-1505628346881-b72b27e84530?w=800&h=800&fit=crop",
				// German shepherd
				"https://images.unsplash.com/photo-1589941013453-ec89f33b5e95?w=800&h=800&fit=crop",
				// Dachshund
				"https://images.unsplash.com/photo-1612195583950-b8fd34c87093?w=800&h=800&fit=crop",
				// dog
				"https://images.unsplash.com/photo-1583511666407-5f06533f2113?w=800&h=800&fit=crop",
				// White Wolf
				"https://images.unsplash.com/photo-1547407139-3c921a66005c?w=800&h=800&fit=crop"
			};

                        String[] catImages = {
				// Orange tabby cat
				"https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=800&h=800&fit=crop",
				// Gray cat looking up
				"https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=800&h=800&fit=crop",
				// Kitten
				"https://images.unsplash.com/photo-1574158622682-e40e69881006?w=800&h=800&fit=crop",
				// White cat
				"https://images.unsplash.com/photo-1526336024174-e58f5cdd8e13?w=800&h=800&fit=crop",
				// Black cat
				"https://images.unsplash.com/photo-1559235038-1b0fadf76f78?w=800&h=800&fit=crop",
				// Siamese cat
				"https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=800&h=800&fit=crop",
				// Calico cat
				"https://images.unsplash.com/photo-1592194996308-7b43878e84a6?w=800&h=800&fit=crop",
				// Persian cat
				"https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=800&h=800&fit=crop",
				// Tabby cat sleeping
				"https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=800&h=800&fit=crop",
				// Maine coon
				"https://images.unsplash.com/photo-1615497001839-b0a0eac3274c?w=800&h=800&fit=crop",
				// Ginger kitten
				"https://images.unsplash.com/photo-1570824104453-508955ab713e?w=800&h=800&fit=crop"
			};

                        String[] birdImages = {
				// Colorful parrot
				"https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=800&h=800&fit=crop",
				// Canary yellow bird
				"https://images.unsplash.com/photo-1522926193341-e9ffd686c60f?w=800&h=800&fit=crop",
				// Macaw parrot
				"https://images.unsplash.com/photo-1544923408-75c5cef46f14?w=800&h=800&fit=crop",
				// Lovebirds
				"https://images.unsplash.com/photo-1501720804996-ae418d1ba820?w=800&h=800&fit=crop",
				// Green parrot
				"https://images.unsplash.com/photo-1504618223053-559bdef9dd5a?w=800&h=800&fit=crop",
				// Burd
				"https://images.unsplash.com/photo-1518992028580-6d57bd80f2dd?w=800&h=800&fit=crop",
				// King Penguin
				"https://images.unsplash.com/photo-1598439210625-5067c578f3f6?w=800&h=800&fit=crop"
			};

                        String[] rabbitImages = {
				// White rabbit
				"https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=800&h=800&fit=crop",
				// Brown bunny
				"https://images.unsplash.com/photo-1535241749838-299277b6305f?w=800&h=800&fit=crop",
				// Baby bunny
				"https://images.unsplash.com/photo-1452857297128-d9c29adba80b?w=800&h=800&fit=crop"
			};

                        String[] otherImages = {
				// Budgerigar / parakeet
				"https://images.unsplash.com/photo-1606567595334-d39972c85dbe?w=800&h=800&fit=crop",
				// Hamster
				"https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=800&h=800&fit=crop",
				// Guinea pig
				"https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=800&h=800&fit=crop",
				// Turtle
				"https://images.unsplash.com/photo-1437622368342-7a3d73a34c8f?w=800&h=800&fit=crop",
				// Hedgehog
				"https://images.unsplash.com/photo-1497752531616-c3afd9760a11?w=800&h=800&fit=crop",
				// Chinchilla
				"https://images.unsplash.com/photo-1590691566903-692bf5ca7493?w=800&h=800&fit=crop",
				// Goldfish
				"https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?w=800&h=800&fit=crop",
				// African Elephant
				"https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?w=800&h=800&fit=crop",
				// Lion
				"https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800&h=800&fit=crop",
				// Polar Bear
				"https://images.unsplash.com/photo-1589656966895-2f33e7653819?w=800&h=800&fit=crop",
				// Brown Bear
				"https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?w=800&h=800&fit=crop",
				// Tiger
				"https://images.unsplash.com/photo-1501705388883-4ed8a543392c?w=800&h=800&fit=crop",
				// Turtle
				"https://images.unsplash.com/photo-1518467166778-b88f373ffec7?w=800&h=800&fit=crop",
				// Giraffe
				"https://images.unsplash.com/photo-1534567153574-2b12153a87f0?w=800&h=800&fit=crop"
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
