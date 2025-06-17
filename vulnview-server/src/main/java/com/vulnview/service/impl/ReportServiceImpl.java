package com.vulnview.service.impl;

import com.vulnview.dto.trend.*;
import com.vulnview.dto.report.*;
import com.vulnview.entity.*;
import com.vulnview.repository.*;
import com.vulnview.service.ReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReportServiceImpl implements ReportService {

    private final ProjectRepository projectRepository;
    private final BuildRepository buildRepository;
    private final ComponentRepository componentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final PipelineRepository pipelineRepository;
    private final ComponentVulnerabilityRepository componentVulnerabilityRepository;

    @Override
    @Transactional(readOnly = true)
    public Optional<ProjectVulnerabilityTrendDto> getVulnerabilityTrendForProject(Long projectId, Integer limit) {
        log.info("Getting vulnerability trend for project {}", projectId);
        
        Project project = projectRepository.findById(projectId)
            .orElse(null);
            
        if (project == null) {
            log.warn("Project {} not found", projectId);
            return Optional.empty();
        }

        // Get builds ordered by date
        List<Build> builds = buildRepository.findByProjectIdOrderByCreatedAtDesc(projectId);
        if (builds.isEmpty()) {
            log.info("No builds found for project {}", projectId);
            return Optional.empty();
        }

        // Apply limit if specified
        if (limit != null && limit > 0) {
            builds = builds.stream()
                .limit(limit)
                .collect(Collectors.toList());
        }

        // Get snapshots for each build
        List<BuildVulnerabilitySnapshotDto> snapshots = builds.stream()
            .map(this::createBuildSnapshot)
            .collect(Collectors.toList());

        // Calculate trend metrics
        int totalVulnerabilities = snapshots.stream()
            .mapToInt(s -> s.getCriticalVulnerabilities() + 
                          s.getHighVulnerabilities() + 
                          s.getMediumVulnerabilities() + 
                          s.getLowVulnerabilities())
            .sum();

        double averageVulnerabilitiesPerBuild = snapshots.isEmpty() ? 0 : 
            (double) totalVulnerabilities / snapshots.size();

        // Calculate trend percentage (comparing first and last build)
        double trendPercentage = calculateTrendPercentage(snapshots);

        ProjectVulnerabilityTrendDto trend = ProjectVulnerabilityTrendDto.builder()
            .projectId(projectId)
            .projectName(project.getName())
            .snapshots(snapshots)
            .totalBuilds(snapshots.size())
            .totalVulnerabilities(totalVulnerabilities)
            .averageVulnerabilitiesPerBuild(averageVulnerabilitiesPerBuild)
            .trendPercentage(trendPercentage)
            .build();

        return Optional.of(trend);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DailyVulnerabilityCountDto> getVulnerabilityTrendOverTime(Long projectId, int days) {
        LocalDateTime startDate = LocalDateTime.now().minusDays(days);
        List<Build> builds = buildRepository.findByProjectIdAndStartAtAfterOrderByStartAtDesc(projectId, startDate);
        
        return builds.stream()
                .map(build -> DailyVulnerabilityCountDto.builder()
                        .date(build.getStartAt())
                        .criticalCount(build.getCriticalVulnCount())
                        .highCount(build.getHighVulnCount())
                        .mediumCount(build.getMediumVulnCount())
                        .lowCount(build.getLowVulnCount())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getVulnerabilityCountByComponent(Long projectId) {
        List<Component> components = componentRepository.findByProjectId(projectId, Pageable.unpaged()).getContent();
        return components.stream()
                .collect(Collectors.toMap(
                        Component::getName,
                        component -> (long) component.getComponentVulnerabilities().size()
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Long> getVulnerabilityCountBySeverity(Long projectId) {
        Map<String, Long> severityCounts = new HashMap<>();
        
        List<Vulnerability> vulnerabilities = vulnerabilityRepository.findByProjectIdAndRiskLevel(projectId, RiskLevel.CRITICAL);
        severityCounts.put("CRITICAL", (long) vulnerabilities.size());
        
        vulnerabilities = vulnerabilityRepository.findByProjectIdAndRiskLevel(projectId, RiskLevel.HIGH);
        severityCounts.put("HIGH", (long) vulnerabilities.size());
        
        vulnerabilities = vulnerabilityRepository.findByProjectIdAndRiskLevel(projectId, RiskLevel.MEDIUM);
        severityCounts.put("MEDIUM", (long) vulnerabilities.size());
        
        vulnerabilities = vulnerabilityRepository.findByProjectIdAndRiskLevel(projectId, RiskLevel.LOW);
        severityCounts.put("LOW", (long) vulnerabilities.size());
        
        return severityCounts;
    }

    @Override
    @Transactional(readOnly = true)
    public PipelineVulnerabilityTrendDto getVulnerabilityTrendForPipeline(Long pipelineId) {
        Pipeline pipeline = pipelineRepository.findById(pipelineId)
                .orElseThrow(() -> new RuntimeException("Pipeline not found"));

        List<Build> builds = buildRepository.findByPipelineIdOrderByStartAtDesc(pipelineId);
        
        List<PipelineVulnerabilityTrendDto.BuildVulnerabilitySummary> buildSummaries = builds.stream()
                .map(this::mapBuildToPipelineSummary)
                .collect(Collectors.toList());

        Map<String, Long> severityDistribution = calculateSeverityDistribution(builds);
        Map<String, Long> componentDistribution = calculateComponentDistribution(builds);
        
        List<DailyVulnerabilityCountDto> dailyTrends = builds.stream()
                .map(build -> DailyVulnerabilityCountDto.builder()
                        .date(build.getStartAt())
                        .criticalCount(build.getCriticalVulnCount())
                        .highCount(build.getHighVulnCount())
                        .mediumCount(build.getMediumVulnCount())
                        .lowCount(build.getLowVulnCount())
                        .build())
                .collect(Collectors.toList());

        return PipelineVulnerabilityTrendDto.builder()
                .pipelineId(pipeline.getId())
                .pipelineName(pipeline.getName())
                .buildSummaries(buildSummaries)
                .severityDistribution(severityDistribution)
                .componentDistribution(componentDistribution)
                .dailyTrends(dailyTrends)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectReportDto generateProjectReport(Long projectId, LocalDateTime startDate, LocalDateTime endDate) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        List<Build> builds = buildRepository.findByProjectIdAndStartAtBetweenOrderByStartAtDesc(projectId, startDate, endDate);

        Map<String, Long> severityDistribution = calculateSeverityDistribution(builds);
        Map<String, Long> componentDistribution = calculateComponentDistribution(builds);
        List<ProjectReportDto.BuildSummary> buildSummaries = builds.stream()
                .map(this::mapBuildToProjectSummary)
                .collect(Collectors.toList());

        return ProjectReportDto.builder()
                .projectId(project.getId())
                .projectName(project.getName())
                .startDate(startDate)
                .endDate(endDate)
                .severityDistribution(severityDistribution)
                .componentDistribution(componentDistribution)
                .buildSummaries(buildSummaries)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public BuildReportDto generateBuildReport(Long buildId) {
        Build build = buildRepository.findById(buildId)
                .orElseThrow(() -> new RuntimeException("Build not found"));

        Map<String, Long> severityCounts = new HashMap<>();
        severityCounts.put("CRITICAL", (long) build.getCriticalVulnCount());
        severityCounts.put("HIGH", (long) build.getHighVulnCount());
        severityCounts.put("MEDIUM", (long) build.getMediumVulnCount());
        severityCounts.put("LOW", (long) build.getLowVulnCount());

        return BuildReportDto.builder()
                .buildId(build.getId())
                .buildName(String.valueOf(build.getBuildNumber()))
                .buildDate(build.getStartAt())
                .projectName(build.getProject().getName())
                .pipelineName(build.getPipeline().getName())
                .severityDistribution(severityCounts)
                .build();
    }

    private BuildVulnerabilitySnapshotDto createBuildSnapshot(Build build) {
        List<Component> components = componentRepository.findBySbomId(build.getSbom().getId());
        List<ComponentVulnerability> vulnerabilities = componentVulnerabilityRepository
            .findByComponentIdIn(components.stream().map(Component::getId).collect(Collectors.toList()));

        Map<RiskLevel, Long> vulnCounts = vulnerabilities.stream()
            .collect(Collectors.groupingBy(
                cv -> cv.getVulnerability().getRiskLevel(),
                Collectors.counting()
            ));

        double averageCvssScore = vulnerabilities.stream()
            .mapToDouble(ComponentVulnerability::getScore)
            .average()
            .orElse(0.0);

        return BuildVulnerabilitySnapshotDto.builder()
            .buildId(build.getId())
            .buildName(build.getName())
            .buildDate(build.getCreatedAt())
            .totalComponents(components.size())
            .vulnerableComponents((int) components.stream()
                .filter(c -> !vulnerabilities.stream()
                    .filter(v -> v.getComponent().getId().equals(c.getId()))
                    .collect(Collectors.toList())
                    .isEmpty())
                .count())
            .criticalVulnerabilities(vulnCounts.getOrDefault(RiskLevel.CRITICAL, 0L).intValue())
            .highVulnerabilities(vulnCounts.getOrDefault(RiskLevel.HIGH, 0L).intValue())
            .mediumVulnerabilities(vulnCounts.getOrDefault(RiskLevel.MEDIUM, 0L).intValue())
            .lowVulnerabilities(vulnCounts.getOrDefault(RiskLevel.LOW, 0L).intValue())
            .averageCvssScore(averageCvssScore)
            .build();
    }

    private double calculateTrendPercentage(List<BuildVulnerabilitySnapshotDto> snapshots) {
        if (snapshots.size() < 2) {
            return 0.0;
        }

        BuildVulnerabilitySnapshotDto first = snapshots.get(snapshots.size() - 1);
        BuildVulnerabilitySnapshotDto last = snapshots.get(0);

        int firstTotal = first.getCriticalVulnerabilities() + 
                        first.getHighVulnerabilities() + 
                        first.getMediumVulnerabilities() + 
                        first.getLowVulnerabilities();
                        
        int lastTotal = last.getCriticalVulnerabilities() + 
                       last.getHighVulnerabilities() + 
                       last.getMediumVulnerabilities() + 
                       last.getLowVulnerabilities();

        if (firstTotal == 0) {
            return lastTotal > 0 ? 100.0 : 0.0;
        }

        return ((double) (lastTotal - firstTotal) / firstTotal) * 100;
    }

    private PipelineVulnerabilityTrendDto.BuildVulnerabilitySummary mapBuildToPipelineSummary(Build build) {
        Map<String, Long> severityCounts = new HashMap<>();
        severityCounts.put("CRITICAL", (long) build.getCriticalVulnCount());
        severityCounts.put("HIGH", (long) build.getHighVulnCount());
        severityCounts.put("MEDIUM", (long) build.getMediumVulnCount());
        severityCounts.put("LOW", (long) build.getLowVulnCount());

        return PipelineVulnerabilityTrendDto.BuildVulnerabilitySummary.builder()
                .buildId(build.getId())
                .buildName(String.valueOf(build.getBuildNumber()))
                .buildDate(build.getStartAt())
                .severityCounts(severityCounts)
                .totalVulnerabilities(build.getCriticalVulnCount() + build.getHighVulnCount() + 
                                    build.getMediumVulnCount() + build.getLowVulnCount())
                .build();
    }

    private ProjectReportDto.BuildSummary mapBuildToProjectSummary(Build build) {
        Map<String, Long> severityCounts = new HashMap<>();
        severityCounts.put("CRITICAL", (long) build.getCriticalVulnCount());
        severityCounts.put("HIGH", (long) build.getHighVulnCount());
        severityCounts.put("MEDIUM", (long) build.getMediumVulnCount());
        severityCounts.put("LOW", (long) build.getLowVulnCount());

        return ProjectReportDto.BuildSummary.builder()
                .buildId(build.getId())
                .buildName(String.valueOf(build.getBuildNumber()))
                .buildDate(build.getStartAt())
                .pipelineName(build.getPipeline().getName())
                .totalVulnerabilities(build.getCriticalVulnCount() + build.getHighVulnCount() + 
                                    build.getMediumVulnCount() + build.getLowVulnCount())
                .severityCounts(severityCounts)
                .build();
    }

    private Map<String, Long> calculateSeverityDistribution(List<Build> builds) {
        Map<String, Long> distribution = new HashMap<>();
        distribution.put("CRITICAL", 0L);
        distribution.put("HIGH", 0L);
        distribution.put("MEDIUM", 0L);
        distribution.put("LOW", 0L);

        for (Build build : builds) {
            distribution.put("CRITICAL", distribution.get("CRITICAL") + build.getCriticalVulnCount());
            distribution.put("HIGH", distribution.get("HIGH") + build.getHighVulnCount());
            distribution.put("MEDIUM", distribution.get("MEDIUM") + build.getMediumVulnCount());
            distribution.put("LOW", distribution.get("LOW") + build.getLowVulnCount());
        }

        return distribution;
    }

    private Map<String, Long> calculateComponentDistribution(List<Build> builds) {
        Map<String, Long> distribution = new HashMap<>();
        for (Build build : builds) {
            for (Component component : build.getSbom().getComponents()) {
                distribution.merge(component.getName(), 
                    (long) component.getComponentVulnerabilities().size(), 
                    Long::sum);
            }
        }
        return distribution;
    }
} 