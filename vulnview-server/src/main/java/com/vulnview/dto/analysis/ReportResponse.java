package com.vulnview.dto.analysis;

import com.vulnview.entity.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ReportResponse {
    private Long analysisId;
    private String analysisName;
    private String projectName;
    private String buildNumber;
    private Map<RiskLevel, Integer> vulnerabilityCountByRisk;
    private Map<String, Integer> vulnerabilityCountByComponent;
    private Map<String, Integer> vulnerabilityCountByCve;
    private String summary;
    private String recommendations;
} 