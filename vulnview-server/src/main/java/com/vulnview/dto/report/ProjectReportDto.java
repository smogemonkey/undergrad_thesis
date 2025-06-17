package com.vulnview.dto.report;

import lombok.Data;
import lombok.Builder;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Data
@Builder
public class ProjectReportDto {
    private Long projectId;
    private String projectName;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private Map<String, Long> severityDistribution;
    private Map<String, Long> componentDistribution;
    private List<BuildSummary> buildSummaries;
    private ProjectMetrics metrics;
    private List<TrendData> vulnerabilityTrends;

    @Data
    @Builder
    public static class BuildSummary {
        private Long buildId;
        private String buildName;
        private LocalDateTime buildDate;
        private String pipelineName;
        private int totalVulnerabilities;
        private Map<String, Long> severityCounts;
    }

    @Data
    @Builder
    public static class ProjectMetrics {
        private int totalVulnerabilities;
        private int criticalVulnerabilities;
        private int highVulnerabilities;
        private int mediumVulnerabilities;
        private int lowVulnerabilities;
        private double averageCvssScore;
        private int componentsWithVulnerabilities;
        private int totalBuilds;
        private int buildsWithVulnerabilities;
    }

    @Data
    @Builder
    public static class TrendData {
        private LocalDateTime timestamp;
        private int totalVulnerabilities;
        private Map<String, Long> severityCounts;
        private Map<String, Long> componentCounts;
    }
} 