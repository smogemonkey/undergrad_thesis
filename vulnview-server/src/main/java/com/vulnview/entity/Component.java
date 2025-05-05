package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;

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

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 50)
    private String version;

    @Column(length = 100)
    private String group;

    @Column(length = 100)
    private String type;

    @Column(length = 500)
    private String description;

    @Column(length = 500)
    private String packageUrl;

    @Column(length = 100)
    private String license;

    @Column(length = 1000)
    private String hash;

    @Column(length = 1000)
    private String evidence;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;

    @ManyToMany(mappedBy = "components")
    @Builder.Default
    private Set<Vulnerability> vulnerabilities = new HashSet<>();

    @ManyToMany
    @JoinTable(
        name = "component_dependencies",
        joinColumns = @JoinColumn(name = "component_id"),
        inverseJoinColumns = @JoinColumn(name = "dependency_id")
    )
    @Builder.Default
    private Set<Component> dependencies = new HashSet<>();

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    @Builder.Default
    private RiskLevel riskLevel = RiskLevel.NONE;

    @ManyToOne
    @JoinColumn(name = "sbom_id")
    private Sbom sbom;

    @CreationTimestamp
    private LocalDateTime createdAt;

    public void setSbom(Sbom sbom) {
        if (this.sbom != null) {
            this.sbom.getComponents().remove(this);
        }
        this.sbom = sbom;
        if (sbom != null && !sbom.getComponents().contains(this)) {
            sbom.getComponents().add(this);
        }
    }

    // Helper methods for managing bidirectional relationship
    public void addVulnerability(Vulnerability vulnerability) {
        vulnerabilities.add(vulnerability);
        vulnerability.getComponents().add(this);
    }

    public void removeVulnerability(Vulnerability vulnerability) {
        vulnerabilities.remove(vulnerability);
        vulnerability.getComponents().remove(this);
    }

    public void addDependency(Component dependency) {
        dependencies.add(dependency);
    }

    public void removeDependency(Component dependency) {
        dependencies.remove(dependency);
    }
} 