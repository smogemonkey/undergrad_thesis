package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Entity
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Table(name = "sbom_dependencies")
public class SbomDependency {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sbom_id")
    private Sbom sbom;

    @Column(name = "from_bom_ref")
    private String fromBomRef;

    @Column(name = "to_bom_ref")
    private String toBomRef;

    @Column(name = "dependency_type")
    private String dependencyType;
} 
 
 