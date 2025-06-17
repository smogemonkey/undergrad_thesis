package com.vulnview.entity;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import jakarta.persistence.*;

@Data
@Entity
@Table(name = "sbom_components")
@NoArgsConstructor
@AllArgsConstructor
public class SbomComponent {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "sbom_id")
    private Sbom sbom;

    @ManyToOne
    @JoinColumn(name = "component_id")
    private Component component;

    @Column(name = "bom_ref")
    private String bomRef;

    @Column(name = "scope")
    private String scope;
} 
 
 