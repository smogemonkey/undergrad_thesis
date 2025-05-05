package com.vulnview.dto.analysis;

import com.vulnview.entity.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private Long id;
    private Long analysisId;
    private String title;
    private String summary;
    private Map<RiskLevel, Integer> vulnerabilityCountByRisk;
    private Map<String, Integer> vulnerabilityCountByComponent;
    private Map<String, Integer> vulnerabilityCountByCve;
    private String recommendations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 