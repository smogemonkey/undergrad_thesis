package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "npm_packages")
public class NpmPackage {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(name = "package_version")
    private String version;

    @Column
    private String description;

    @Column(name = "repository_url")
    private String repositoryUrl;

    @Column(name = "homepage_url")
    private String homepageUrl;

    @Column(name = "package_json")
    private String packageJson;

    @Column(name = "created_at")
    private java.time.LocalDateTime createdAt;

    @Column(name = "updated_at")
    private java.time.LocalDateTime updatedAt;
} 