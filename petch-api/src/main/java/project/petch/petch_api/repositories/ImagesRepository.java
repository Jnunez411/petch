package project.petch.petch_api.repositories;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.transaction.annotation.Transactional;
import project.petch.petch_api.models.Images;
import java.util.List;

public interface ImagesRepository extends JpaRepository<Images, Long>{
    List<Images> findByPetId(Long petId);
    
    @Transactional
    @Modifying
    void deleteByPetId(Long petId);
}