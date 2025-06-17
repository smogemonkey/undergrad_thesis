package com.vulnview.entity;

import com.vulnview.dto.sbom.SbomResponseDto;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

@Getter
@Setter
@Entity
@Table(name = "sboms")
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Sbom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "build_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Build build;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id", nullable = false)
    private Repository repository;

    @Column(nullable = false)
    private String version;

    @Column(name = "serial_number")
    private String serialNumber;

    @Column(name = "bom_format")
    private String bomFormat;

    @Column(name = "spec_version")
    private String specVersion;

    @Column(nullable = false)
    private String commitSha;

    @Column(name = "commit_message")
    private String commitMessage;

    @Column(name = "commit_author")
    private String commitAuthor;

    @Lob
    private byte[] content;

    @Builder.Default
    @OneToMany(mappedBy = "sbom", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Set<Component> components = new HashSet<>();

    @OneToMany(mappedBy = "sbom", cascade = CascadeType.ALL)
    private Set<DependencyEdge> dependencies = new HashSet<>();

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addComponent(Component component) {
        components.add(component);
        component.setSbom(this);
    }

    public void removeComponent(Component component) {
        components.remove(component);
        component.setSbom(null);
    }

    public SbomResponseDto toDto() {
        return SbomResponseDto.builder()
                .id(this.id)
                .buildId(this.build != null ? this.build.getId() : null)
                .version(this.version)
                .serialNumber(this.serialNumber)
                .bomFormat(this.bomFormat)
                .specVersion(this.specVersion)
                .components(this.components.stream()
                    .map(Component::toDto)
                    .collect(java.util.stream.Collectors.toList()))
                .createdAt(this.createdAt)
                .updatedAt(this.updatedAt)
                .build();
    }
}