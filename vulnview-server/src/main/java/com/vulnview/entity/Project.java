package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.HashSet;
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

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(length = 50)
    private String version;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Component> components = new HashSet<>();

    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private Set<Vulnerability> vulnerabilities = new HashSet<>();

    @Column(name = "total_components")
    @Builder.Default
    private Integer totalComponents = 0;

    @Column(name = "critical_risks")
    @Builder.Default
    private Integer criticalRisks = 0;

    @Column(name = "high_risks")
    @Builder.Default
    private Integer highRisks = 0;

    @Column(name = "medium_risks")
    @Builder.Default
    private Integer mediumRisks = 0;

    @Column(name = "low_risks")
    @Builder.Default
    private Integer lowRisks = 0;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    // Helper methods for managing bidirectional relationship
    public void addComponent(Component component) {
        components.add(component);
        component.setProject(this);
    }

    public void removeComponent(Component component) {
        components.remove(component);
        component.setProject(null);
    }

    public void addVulnerability(Vulnerability vulnerability) {
        vulnerabilities.add(vulnerability);
        vulnerability.setProject(this);
    }

    public void removeVulnerability(Vulnerability vulnerability) {
        vulnerabilities.remove(vulnerability);
        vulnerability.setProject(null);
    }
} 