package project.petch.petch_api.models;

import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;
import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "images")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder

//Local Disk Storage for Images may need to change for cloud storage when "deployed"
public class Images{
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "file_name", nullable = false)
    private String fileName;

    @Column(name = "file_path", nullable = false)
    private String filePath;

    @Column(name = "alt_text")
    private String altText;

    @Column(name = "file_size")
    private Long fileSize;

    @JsonBackReference
    @ManyToOne(fetch = FetchType.LAZY) //lazy loading
    @JoinColumn(name = "pet_id", nullable = false)
    private Pets pet;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

}