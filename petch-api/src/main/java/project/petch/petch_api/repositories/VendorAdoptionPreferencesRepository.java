package project.petch.petch_api.repositories;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import project.petch.petch_api.models.VendorAdoptionPreferences;
import java.util.Optional;

@Repository
public interface VendorAdoptionPreferencesRepository extends JpaRepository<VendorAdoptionPreferences, Long>{
    Optional<VendorAdoptionPreferences> findByVendorProfileUserId(Long userId);
}
