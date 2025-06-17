package com.vulnview.entity;

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
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "builds")
@Builder
public class Build {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name")
    private String name;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pipeline_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Pipeline pipeline;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Project project;

    @OneToOne(mappedBy = "build", cascade = CascadeType.ALL)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Sbom sbom;

    @Column(nullable = false)
    private String repository;

    @Column(nullable = false)
    private String branch;

    @Column(name = "build_number", nullable = false)
    private Integer buildNumber;

    @Column(nullable = false)
    private String result;

    @Column(name = "duration")
    private Long duration;

    @Column(name = "status")
    @Enumerated(EnumType.STRING)
    private BuildStatus status;

    @Column(name = "start_at")
    private LocalDateTime startAt;

    @Column(name = "end_at")
    private LocalDateTime endAt;

    @OneToMany(mappedBy = "build", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<Analysis> analyses = new HashSet<>();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "build_date")
    private LocalDateTime buildDate;

    @Column(name = "sbom_uuid")
    private String sbomUuid;

    @Column(name = "critical_vuln_count")
    private Integer criticalVulnCount;

    @Column(name = "high_vuln_count")
    private Integer highVulnCount;

    @Column(name = "medium_vuln_count")
    private Integer mediumVulnCount;

    @Column(name = "low_vuln_count")
    private Integer lowVulnCount;

    @Column(name = "unknown_vuln_count")
    private Integer unknownVulnCount;

    @Column(name = "total_components_with_vulns")
    private Integer totalComponentsWithVulns;

    @Column(name = "unique_licenses_count")
    private Integer uniqueLicensesCount;

    @Column(name = "licenses_compliance_status_counts_json", columnDefinition = "TEXT")
    private String licensesComplianceStatusCountsJson;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void addAnalysis(Analysis analysis) {
        analyses.add(analysis);
        analysis.setBuild(this);
    }

    public void removeAnalysis(Analysis analysis) {
        analyses.remove(analysis);
        analysis.setBuild(null);
    }

    public void setPipeline(Pipeline pipeline) {
        this.pipeline = pipeline;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public void setSbom(Sbom sbom) {
        this.sbom = sbom;
    }

    public Long getPipelineId() {
        return pipeline != null ? pipeline.getId() : null;
    }
} 