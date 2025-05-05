package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "dependency_edges")
@Getter
@Setter
public class DependencyEdge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sbom_id", nullable = false)
    private Sbom sbom;

    @ManyToOne
    @JoinColumn(name = "source_component_id", nullable = false)
    private Component sourceComponent;

    @ManyToOne
    @JoinColumn(name = "target_component_id", nullable = false)
    private Component targetComponent;

    @Column(name = "dependency_type")
    private String dependencyType;
} 