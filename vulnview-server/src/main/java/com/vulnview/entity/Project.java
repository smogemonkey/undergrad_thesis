package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "projects")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(length = 1000)
    private String description;

    @Column(name = "group_name")
    private String group;

    @Column(name = "owner_id", nullable = false)
    private Long ownerId;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<Component> components = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<Analysis> analyses = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<Pipeline> pipelines = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<Build> builds = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<Vulnerability> vulnerabilities = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Set<Membership> memberships = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<Repository> repositories = new HashSet<>();

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    @Column(name = "last_build_at")
    private LocalDateTime lastBuildAt;

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
        component.setProject(this);
    }

    public void removeComponent(Component component) {
        components.remove(component);
        component.setProject(null);
    }

    public void addAnalysis(Analysis analysis) {
        analyses.add(analysis);
        analysis.setProject(this);
    }

    public void removeAnalysis(Analysis analysis) {
        analyses.remove(analysis);
        analysis.setProject(null);
    }

    public void addPipeline(Pipeline pipeline) {
        pipelines.add(pipeline);
        pipeline.setProject(this);
    }

    public void removePipeline(Pipeline pipeline) {
        pipelines.remove(pipeline);
        pipeline.setProject(null);
    }

    public void addBuild(Build build) {
        builds.add(build);
        build.setProject(this);
    }

    public void removeBuild(Build build) {
        builds.remove(build);
        build.setProject(null);
    }

    public void addRepository(Repository repository) {
        repositories.add(repository);
        repository.setProject(this);
    }

    public void removeRepository(Repository repository) {
        repositories.remove(repository);
        repository.setProject(null);
    }

    public void setUser(User user) {
        this.ownerId = user.getId();
    }
} 