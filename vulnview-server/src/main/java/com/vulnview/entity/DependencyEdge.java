package com.vulnview.entity;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import jakarta.persistence.*;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "dependency_edges")
public class DependencyEdge {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "source_component_id")
    private Component sourceComponent;

    @ManyToOne
    @JoinColumn(name = "target_component_id")
    private Component targetComponent;

    @ManyToOne
    @JoinColumn(name = "sbom_id")
    private Sbom sbom;

    private String type;
    private String scope;
    private Boolean direct;
    private String purl;
} 