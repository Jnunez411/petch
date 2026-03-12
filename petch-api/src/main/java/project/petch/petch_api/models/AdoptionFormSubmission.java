package project.petch.petch_api.models;

import java.time.LocalDateTime;

import org.hibernate.annotations.CreationTimestamp;

import com.fasterxml.jackson.annotation.JsonBackReference;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "adoption_form_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdoptionFormSubmission{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false) // lazy loadin realtion of submission to pet can link to owner from pet
    @JoinColumn(name = "pet_id", nullable = false)
    @JsonBackReference
    private Pets pet;

    @ManyToOne(fetch = FetchType.LAZY, optional = false) // lazy loadin relation of submission to adopter user
    @JoinColumn(name = "adopter_user_id", nullable = false)
    private User adopterUser;

    @Lob
    @Column(name = "pdf_data", nullable = false)
    private byte[] pdfData;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "content_type", nullable = false)
    private String contentType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}