package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pipelines")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Pipeline {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @Column(nullable = false)
    private String name;

    @Column
    private String description;

    @Column
    private String type;

    @Column
    private String status;

    @OneToMany(mappedBy = "pipeline", cascade = CascadeType.ALL)
    private List<Build> builds;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    public void addBuild(Build build) {
        builds.add(build);
        build.setPipeline(this);
    }

    public void removeBuild(Build build) {
        builds.remove(build);
        build.setPipeline(null);
    }
} 