package project.petch.petch_api.repositories;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import project.petch.petch_api.models.PetDocumentFile;

public interface PetDocumentFileRepository extends JpaRepository<PetDocumentFile, Long>{
    Optional<PetDocumentFile> findByIdAndPetDocumentsPetId(Long id, Long petId);
}