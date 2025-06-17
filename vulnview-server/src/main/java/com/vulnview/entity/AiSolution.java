package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;
import java.time.LocalDateTime;

@Entity
@Table(name = "ai_solutions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiSolution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "vulnerability_id", nullable = false)
    private String vulnerabilityId;

    @Column(name = "component_name", nullable = false)
    private String componentName;

    @Column(name = "component_version")
    private String componentVersion;

    @Column(name = "context", columnDefinition = "TEXT")
    private String context;

    @Column(name = "remediation", columnDefinition = "TEXT")
    private String remediation;

    @Column(name = "suggestion", columnDefinition = "TEXT")
    private String suggestion;

    @Column(name = "severity")
    private String severity;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
} 