package project.petch.petch_api.models;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "pets")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Pets{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)   
    private Long id;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "species", nullable = false)
    private String species;

    @Column(name = "breed", nullable = false)
    private String breed;

    @Column(name = "age", nullable = false)
    private Integer age;

    @Column(name = "description", length = 1000)
    private String description;

    @Column(name = "atRisk", nullable = false)
    private Boolean atRisk;

    @Column(name = "fosterable", nullable = false)
    private Boolean fosterable;

    //Image Realationship
    @JsonManagedReference
    @OneToMany(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<Images> images = new ArrayList<>();

    //User/Vendor Relationship
    @JsonBackReference
    @ManyToOne(fetch = FetchType.EAGER) // quickly loads user to quickly get all their pets
    @JoinColumn(name = "user_id", nullable = true)
    private User user;

    //Adoption Details Relationship (One-to-One)
    @JsonManagedReference
    @OneToOne(mappedBy = "pet", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private AdoptionDetails adoptionDetails;

    //Must add realationship to shelter
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "shelter_id", nullable = false)
    // private Shelters shelter;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}

