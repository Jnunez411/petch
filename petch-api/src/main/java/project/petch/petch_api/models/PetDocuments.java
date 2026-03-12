package project.petch.petch_api.models;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonBackReference;
import com.fasterxml.jackson.annotation.JsonManagedReference;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
// this is is for the documents related to the pet such as medical records, vaccination certificates, etc.
// these show at the bottom of pet profiles
// each pet can have multiple documents, but each document is linked to one pet
// this is the table that links the pet to its documents!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
@Entity
@Table(name = "pet_documents")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PetDocuments{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonBackReference("pet-documents")
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "pet_id", nullable = false, unique = true)
    private Pets pet;

    @Builder.Default
    @JsonManagedReference("pet-document-files")
    @OneToMany(mappedBy = "petDocuments", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<PetDocumentFile> documents = new ArrayList<>();

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}