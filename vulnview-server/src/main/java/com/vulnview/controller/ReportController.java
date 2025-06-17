package com.vulnview.controller;

import com.vulnview.dto.trend.PipelineVulnerabilityTrendDto;
import com.vulnview.dto.trend.ProjectVulnerabilityTrendDto;
import com.vulnview.dto.report.BuildReportDto;
import com.vulnview.dto.report.ProjectReportDto;
import com.vulnview.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;

@Slf4j
@RestController
@RequestMapping("/api/v1/reports")
@RequiredArgsConstructor
public class ReportController {
    private final ReportService reportService;

    @GetMapping("/projects/{projectId}/vulnerability-trend")
    public ResponseEntity<ProjectVulnerabilityTrendDto> getVulnerabilityTrend(
            @PathVariable Long projectId,
            @RequestParam(required = false) Integer limit) {
        log.info("Getting vulnerability trend for project {} with limit {}", projectId, limit);
        
        return reportService.getVulnerabilityTrendForProject(projectId, limit)
            .map(ResponseEntity::ok)
            .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/pipelines/{pipelineId}/vulnerability-trend")
    public ResponseEntity<PipelineVulnerabilityTrendDto> getVulnerabilityTrendForPipeline(
            @PathVariable Long pipelineId) {
        return ResponseEntity.ok(reportService.getVulnerabilityTrendForPipeline(pipelineId));
    }

    @GetMapping("/builds/{buildId}")
    public ResponseEntity<BuildReportDto> generateBuildReport(@PathVariable Long buildId) {
        return ResponseEntity.ok(reportService.generateBuildReport(buildId));
    }

    @GetMapping("/projects/{projectId}")
    public ResponseEntity<ProjectReportDto> generateProjectReport(
            @PathVariable Long projectId,
            @RequestParam(required = false) LocalDateTime startDate,
            @RequestParam(required = false) LocalDateTime endDate) {
        return ResponseEntity.ok(reportService.generateProjectReport(projectId, startDate, endDate));
    }
} 