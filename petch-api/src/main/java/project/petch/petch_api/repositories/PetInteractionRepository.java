package project.petch.petch_api.repositories;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import project.petch.petch_api.models.User;
import project.petch.petch_api.models.PetInteraction;

@Repository
public interface PetInteractionRepository extends JpaRepository<PetInteraction, Long> {
    List<PetInteraction> findByUser(User user);

    @Query("SELECT i FROM PetInteraction i JOIN FETCH i.pet WHERE i.user = :user AND i.interactionType = :type")
    List<PetInteraction> findByUserAndInteractionType(@Param("user") User user,
            @Param("type") PetInteraction.InteractionType type);
}
