package project.petch.petch_api;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import project.petch.petch_api.dto.user.UserType;
import project.petch.petch_api.models.Pets;
import project.petch.petch_api.models.User;
import project.petch.petch_api.repositories.PetsRepository;
import project.petch.petch_api.repositories.UserRepository;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class PetAdoptionControllerTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PetsRepository petsRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private User ownerVendor;
    private User otherVendor;
    private User adminUser;
    private Pets testPet;

    @BeforeEach
    void setUp() {
        ownerVendor = saveUser(UserType.VENDOR);
        otherVendor = saveUser(UserType.VENDOR);
        adminUser  = saveUser(UserType.ADMIN);
        testPet = petsRepository.save(Pets.builder()
                .name("AdoptionCtrlTestPet").species("Dog").breed("Labrador")
                .age(3).atRisk(false).fosterable(false)
                .user(ownerVendor)
                .build());
    }

    @AfterEach
    void tearDown() {
        if (testPet != null)    petsRepository.deleteById(testPet.getId());
        if (ownerVendor != null) userRepository.deleteById(ownerVendor.getId());
        if (otherVendor != null) userRepository.deleteById(otherVendor.getId());
        if (adminUser != null)   userRepository.deleteById(adminUser.getId());
    }

    private User saveUser(UserType type) {
        User u = new User();
        u.setEmail("test-" + UUID.randomUUID() + "@adoption.test");
        u.setPasswordHash(passwordEncoder.encode("pass"));
        u.setUserType(type);
        return userRepository.save(u);
    }

    @Test
    void unauthenticated_returns401() throws Exception {
        mockMvc.perform(put("/api/pets/{id}/adoption-status", testPet.getId())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"isAdopted\": true}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void missingIsAdoptedField_returns400() throws Exception {
        mockMvc.perform(put("/api/pets/{id}/adoption-status", testPet.getId())
                .with(user(ownerVendor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void unknownPetId_returns404() throws Exception {
        mockMvc.perform(put("/api/pets/{id}/adoption-status", Long.MAX_VALUE)
                .with(user(ownerVendor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"isAdopted\": true}"))
                .andExpect(status().isNotFound());
    }

    @Test
    void nonOwnerVendor_returns403() throws Exception {
        mockMvc.perform(put("/api/pets/{id}/adoption-status", testPet.getId())
                .with(user(otherVendor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"isAdopted\": true}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void ownerVendor_canMarkAdoptedAndPersists() throws Exception {
        mockMvc.perform(put("/api/pets/{id}/adoption-status", testPet.getId())
                .with(user(ownerVendor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"isAdopted\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isAdopted").value(true));

        assertThat(petsRepository.findById(testPet.getId()).orElseThrow().getIsAdopted()).isTrue();
    }

    @Test
    void adminUser_canMarkAdoptedAndPersists() throws Exception {
        mockMvc.perform(put("/api/pets/{id}/adoption-status", testPet.getId())
                .with(user(adminUser))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"isAdopted\": true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isAdopted").value(true));

        assertThat(petsRepository.findById(testPet.getId()).orElseThrow().getIsAdopted()).isTrue();
    }

    @Test
    void adoptedPet_excludedFromPublicListing() throws Exception {
        testPet.setIsAdopted(true);
        petsRepository.save(testPet);

        mockMvc.perform(get("/api/pets")
                .param("search", "AdoptionCtrlTestPet"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(0));
    }

    @Test
    void adoptedPet_visibleOnVendorDashboard() throws Exception {
        testPet.setIsAdopted(true);
        petsRepository.save(testPet);

        mockMvc.perform(get("/api/pets/user/{userId}", ownerVendor.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.id==" + testPet.getId() + ")]").isNotEmpty());
    }

    @Test
    void ownerVendor_canToggleBackToNotAdopted() throws Exception {
        mockMvc.perform(put("/api/pets/{id}/adoption-status", testPet.getId())
                .with(user(ownerVendor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"isAdopted\": true}"))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/pets/{id}/adoption-status", testPet.getId())
                .with(user(ownerVendor))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"isAdopted\": false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.isAdopted").value(false));

        assertThat(petsRepository.findById(testPet.getId()).orElseThrow().getIsAdopted()).isFalse();
    }
}
