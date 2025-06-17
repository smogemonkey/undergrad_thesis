package com.vulnview.dto.project;

import com.vulnview.dto.component.ComponentResponseDto;
import com.vulnview.entity.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectResponse {
    private Long id;
    private String name;
    private String description;
    private String ownerUsername;
    private List<ComponentResponseDto> components;
    private int totalComponents;
    private Map<RiskLevel, Integer> riskLevelCounts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 