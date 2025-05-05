package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "builds")
@Getter
@Setter
public class Build {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String repository;

    @Column(nullable = false)
    private String branch;

    @Column(nullable = false)
    private int buildNumber;

    @Column(nullable = false)
    private String result;

    @Column(nullable = false)
    private long duration;

    @Column(nullable = false)
    private LocalDateTime startAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    private Pipeline pipeline;

    @OneToOne(mappedBy = "build", cascade = CascadeType.ALL, orphanRemoval = true)
    private Sbom sbom;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
} 