package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "ai_fix_status")
public class AiFixStatus {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long sbomId;

    @Column(nullable = false)
    private String vulnerabilityDbId;

    @Column(nullable = false)
    private String affectedComponentPurl;

    @Column(nullable = false)
    private String affectedComponentVersion;

    @Column(nullable = false)
    private boolean fixed;

    @Column(nullable = false)
    private LocalDateTime markedAt;

    @Column(nullable = false)
    private String markedBy;
} 