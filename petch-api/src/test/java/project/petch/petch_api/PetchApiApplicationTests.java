package project.petch.petch_api;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

import org.springframework.beans.factory.annotation.Autowired;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.service.PetService;

@SpringBootTest
class PetchApiApplicationTests {

	@Autowired
	private PetService petService;

	@Test
	void contextLoads() {
	}

	@Test //omar simple but my first time writing a test T^T so simple
	void testCreatePet(){
		Pets pet = Pets.builder().name("TestPet").species("Dog").breed("Labrador")
			.age(3).atRisk(false).fosterable(true).build();
		Pets savedPet = petService.createPet(pet);
		assert savedPet.getId() != null;
		assert savedPet.getName().equals("TestPet");

		savedPet.setName("UpdatedPet");
		savedPet.setAge(5);
		Pets updatedPet = petService.createPet(savedPet);

		assert updatedPet.getId().equals(savedPet.getId());
		assert updatedPet.getName().equals("UpdatedPet");
		assert updatedPet.getAge() == 5;
	}
}
