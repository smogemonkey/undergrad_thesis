package com.vulnview.dto.report;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class BuildReportDto {
    private Long buildId;
    private String buildName;
    private LocalDateTime buildDate;
    private String projectName;
    private String pipelineName;
    private Map<String, Long> severityDistribution;
    private Map<String, Long> componentDistribution;
    private List<VulnerabilitySummary> vulnerabilities;
    private BuildMetrics metrics;

    @Data
    @Builder
    public static class VulnerabilitySummary {
        private String cveId;
        private String description;
        private String severity;
        private String affectedComponent;
        private String remediationStatus;
    }

    @Data
    @Builder
    public static class BuildMetrics {
        private int totalVulnerabilities;
        private int criticalVulnerabilities;
        private int highVulnerabilities;
        private int mediumVulnerabilities;
        private int lowVulnerabilities;
        private double averageCvssScore;
        private int componentsWithVulnerabilities;
    }
} 