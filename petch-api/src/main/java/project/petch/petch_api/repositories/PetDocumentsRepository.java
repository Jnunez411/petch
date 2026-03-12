package project.petch.petch_api.repositories;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import project.petch.petch_api.models.PetDocuments;

public interface PetDocumentsRepository extends JpaRepository<PetDocuments, Long>{
    Optional<PetDocuments> findByPetId(Long petId);
    void deleteByPetId(Long petId);
}