package com.vulnview.dto.project;

import com.vulnview.entity.RiskLevel;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String version;
    private String ownerUsername;
    private Integer totalComponents;
    private Map<RiskLevel, Integer> riskLevelCounts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 