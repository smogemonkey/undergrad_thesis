package com.vulnview.entity;

import com.vulnview.dto.component.ComponentResponseDto;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.stream.Collectors;

@Data
@Entity
@Table(name = "components")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Component {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Column(name = "version", length = 50)
    private String version;

    @Column(name = "group_name", length = 100)
    private String groupName;

    @Column(name = "type", length = 100)
    private String type;

    @Column(name = "description", length = 500)
    private String description;

    @Column(name = "package_url", length = 500)
    private String packageUrl;

    @Column(name = "vendor", length = 100)
    private String vendor;

    @Column(name = "product", length = 100)
    private String product;

    @Column(name = "hash", length = 1000)
    private String hash;

    @Column(name = "evidence", columnDefinition = "TEXT")
    private String evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Project project;

    @OneToMany(mappedBy = "component", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<ComponentVulnerability> componentVulnerabilities = new HashSet<>();

    @OneToMany(mappedBy = "sourceComponent")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<DependencyEdge> outgoingDependencies = new HashSet<>();

    @OneToMany(mappedBy = "targetComponent")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    @Builder.Default
    private Set<DependencyEdge> incomingDependencies = new HashSet<>();

    @Column(name = "risk_level", nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RiskLevel riskLevel = RiskLevel.NONE;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sbom_id")
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    @com.fasterxml.jackson.annotation.JsonIgnore
    private Sbom sbom;

    @Column(name = "size")
    private Long size;

    @Column(name = "last_enriched_at")
    private LocalDateTime lastEnrichedAt;

    @Column(name = "is_direct_dependency")
    private Boolean isDirectDependency;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "repository_id")
    private Repository repository;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public void setSbom(Sbom sbom) {
        if (this.sbom != null) {
            this.sbom.getComponents().remove(this);
        }
        this.sbom = sbom;
        if (sbom != null && !sbom.getComponents().contains(this)) {
            sbom.getComponents().add(this);
        }
    }

    public void addVulnerability(Vulnerability vulnerability) {
        ComponentVulnerability componentVulnerability = ComponentVulnerability.builder()
            .component(this)
            .vulnerability(vulnerability)
            .severity(vulnerability.getSeverity())
            .score(vulnerability.getCvssScore())
            .cvssScore(vulnerability.getCvssScore())
            .sbom(this.sbom)
            .cve(vulnerability.getCveId())
            .description(vulnerability.getDescription())
            .cvssVector(vulnerability.getCvssVector())
            .build();
        componentVulnerabilities.add(componentVulnerability);
    }

    public void removeVulnerability(Vulnerability vulnerability) {
        componentVulnerabilities.removeIf(cv -> cv.getVulnerability().equals(vulnerability));
    }

    public Set<Vulnerability> getVulnerabilities() {
        return componentVulnerabilities.stream()
            .map(ComponentVulnerability::getVulnerability)
            .collect(Collectors.toSet());
    }

    public void addOutgoingDependency(Component targetComponent) {
        DependencyEdge edge = DependencyEdge.builder()
            .sourceComponent(this)
            .targetComponent(targetComponent)
            .sbom(this.sbom)
            .build();
        outgoingDependencies.add(edge);
    }

    public void addIncomingDependency(Component sourceComponent) {
        DependencyEdge edge = DependencyEdge.builder()
            .sourceComponent(sourceComponent)
            .targetComponent(this)
            .sbom(this.sbom)
            .build();
        incomingDependencies.add(edge);
    }

    public void removeOutgoingDependency(Component targetComponent) {
        outgoingDependencies.removeIf(edge -> edge.getTargetComponent().equals(targetComponent));
    }

    public void removeIncomingDependency(Component sourceComponent) {
        incomingDependencies.removeIf(edge -> edge.getSourceComponent().equals(sourceComponent));
    }

    public Set<Component> getDependencies() {
        Set<Component> dependencies = new HashSet<>();
        outgoingDependencies.forEach(edge -> dependencies.add(edge.getTargetComponent()));
        return dependencies;
    }

    public Set<Component> getDependents() {
        Set<Component> dependents = new HashSet<>();
        incomingDependencies.forEach(edge -> dependents.add(edge.getSourceComponent()));
        return dependents;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public void setPurl(String purl) {
        this.packageUrl = purl;
    }

    public String getPurl() {
        return packageUrl;
    }

    public String getPackageUrl() {
        return packageUrl;
    }

    public void setPackageUrl(String packageUrl) {
        this.packageUrl = packageUrl;
    }

    public Long getSize() {
        return size;
    }

    public void setSize(Long size) {
        this.size = size;
    }

    public ComponentResponseDto toDto() {
        return ComponentResponseDto.builder()
                .id(this.id)
                .name(this.name)
                .version(this.version)
                .groupName(this.groupName)
                .type(this.type)
                .description(this.description)
                .packageUrl(this.packageUrl)
                .hash(this.hash)
                .evidence(this.evidence)
                .riskLevel(this.riskLevel)
                .projectId(this.project != null ? this.project.getId() : null)
                .sbomId(this.sbom != null ? this.sbom.getId() : null)
                .vulnerabilityIds(this.componentVulnerabilities.stream()
                    .map(cv -> cv.getVulnerability().getId())
                    .collect(java.util.stream.Collectors.toSet()))
                .dependencyIds(this.outgoingDependencies.stream()
                    .map(edge -> edge.getTargetComponent().getId())
                    .collect(java.util.stream.Collectors.toSet()))
                .createdAt(this.createdAt)
                .build();
    }

    public Long getBomRef() {
        // TODO Auto-generated method stub
        throw new UnsupportedOperationException("Unimplemented method 'getBomRef'");
    }
} 