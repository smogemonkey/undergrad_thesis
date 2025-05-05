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
import java.util.ArrayList;

@Data
@Entity
@Table(name = "sboms")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sbom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "bom_format")
    private String bomFormat;

    @Column(name = "spec_version")
    private String specVersion;

    @Column(name = "version")
    private String version;

    @Column(name = "timestamp")
    private String timestamp;

    @OneToOne
    @JoinColumn(name = "build_id")
    private Build build;

    @OneToMany(mappedBy = "sbom", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<Component> components = new ArrayList<>();

    @OneToMany(mappedBy = "sbom", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<DependencyEdge> dependencyEdges = new ArrayList<>();

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
} 