package project.petch.petch_api.models;

import java.util.HashMap;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.MapKeyColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "user_preferences")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonBackReference
    private User user;

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "user_species_weights", joinColumns = @JoinColumn(name = "preference_id"))
    @MapKeyColumn(name = "species")
    @Column(name = "weight")
    private Map<String, Double> speciesWeights = new HashMap<>();

    @Builder.Default
    @ElementCollection
    @CollectionTable(name = "user_breed_weights", joinColumns = @JoinColumn(name = "preference_id"))
    @MapKeyColumn(name = "breed")
    @Column(name = "weight")
    private Map<String, Double> breedWeights = new HashMap<>();

    @Builder.Default
    @Column(name = "weight_young")
    private Double weightYoung = 0.0;

    @Builder.Default
    @Column(name = "weight_adult")
    private Double weightAdult = 0.0;

    @Builder.Default
    @Column(name = "weight_mature")
    private Double weightMature = 0.0;

    @Builder.Default
    @Column(name = "weight_senior")
    private Double weightSenior = 0.0;

    @Builder.Default
    @Column(name = "fosterable_weight")
    private Double fosterableWeight = 0.0;

    @Builder.Default
    @Column(name = "at_risk_weight")
    private Double atRiskWeight = 0.0;

    @Builder.Default
    @Column(name = "total_swipes")
    private Integer totalSwipes = 0;
}
