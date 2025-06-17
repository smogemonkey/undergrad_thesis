package com.vulnview.service;

import com.vulnview.dto.trend.ProjectVulnerabilityTrendDto;
import com.vulnview.dto.trend.PipelineVulnerabilityTrendDto;
import com.vulnview.dto.report.BuildReportDto;
import com.vulnview.dto.report.ProjectReportDto;
import java.time.LocalDateTime;
import java.util.Optional;

public interface ReportService {
    /**
     * Get vulnerability trend data for a project
     * @param projectId The ID of the project
     * @param limit Optional limit on number of builds to include
     * @return Project vulnerability trend data
     */
    Optional<ProjectVulnerabilityTrendDto> getVulnerabilityTrendForProject(Long projectId, Integer limit);

    /**
     * Get vulnerability trend data for a pipeline
     * @param pipelineId The ID of the pipeline
     * @return Pipeline vulnerability trend data
     */
    PipelineVulnerabilityTrendDto getVulnerabilityTrendForPipeline(Long pipelineId);

    /**
     * Generate a report for a specific build
     * @param buildId The ID of the build
     * @return Build report data
     */
    BuildReportDto generateBuildReport(Long buildId);

    /**
     * Generate a report for a project
     * @param projectId The ID of the project
     * @param startDate The start date for the report period
     * @param endDate The end date for the report period
     * @return Project report data
     */
    ProjectReportDto generateProjectReport(Long projectId, LocalDateTime startDate, LocalDateTime endDate);

    /**
     * Get the number of vulnerabilities by severity for a project
     * @param projectId The ID of the project
     * @return Map of severity to count
     */
    java.util.Map<String, Long> getVulnerabilityCountBySeverity(Long projectId);

    /**
     * Get the number of vulnerabilities by component for a project
     * @param projectId The ID of the project
     * @return Map of component name to vulnerability count
     */
    java.util.Map<String, Long> getVulnerabilityCountByComponent(Long projectId);

    /**
     * Get the trend of vulnerability counts over time for a project
     * @param projectId The ID of the project
     * @param days The number of days to look back
     * @return List of daily vulnerability counts
     */
    java.util.List<com.vulnview.dto.trend.DailyVulnerabilityCountDto> getVulnerabilityTrendOverTime(Long projectId, int days);
} 