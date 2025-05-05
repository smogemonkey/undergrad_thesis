package com.vulnview.dto.analysis;

import com.vulnview.entity.RiskLevel;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
public class AnalysisResponse {
    private Long id;
    private String name;
    private String description;
    private Long projectId;
    private String projectName;
    private Map<RiskLevel, Integer> vulnerabilityCountByRisk;
    private Map<String, Integer> vulnerabilityCountByComponent;
    private Map<String, Integer> vulnerabilityCountByCve;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 