package com.vulnview.service.impl;

import com.vulnview.dto.analysis.AnalysisCreateRequest;
import com.vulnview.dto.analysis.AnalysisResponse;
import com.vulnview.dto.analysis.ReportResponse;
import com.vulnview.entity.Analysis;
import com.vulnview.entity.Build;
import com.vulnview.entity.Project;
import com.vulnview.entity.RiskLevel;
import com.vulnview.exception.NotFoundException;
import com.vulnview.repository.AnalysisRepository;
import com.vulnview.repository.BuildRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.service.AnalysisService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalysisServiceImpl implements AnalysisService {

    private final AnalysisRepository analysisRepository;
    private final ProjectRepository projectRepository;
    private final BuildRepository buildRepository;

    @Override
    @Transactional
    public AnalysisResponse createAnalysis(AnalysisCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found"));
        
        Build build = buildRepository.findById(request.getBuildId())
                .orElseThrow(() -> new NotFoundException("Build not found"));

        Analysis analysis = Analysis.builder()
                .project(project)
                .build(build)
                .name(request.getName())
                .description(request.getDescription())
                .analysisType(request.getAnalysisType())
                .status("PENDING")
                .startTime(LocalDateTime.now())
                .build();

        analysis = analysisRepository.save(analysis);
        return mapToResponse(analysis);
    }

    @Override
    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysis(Long id) {
        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Analysis not found"));
        return mapToResponse(analysis);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnalysisResponse> getAllAnalyses() {
        return analysisRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<AnalysisResponse> getAnalysesByProject(Long projectId) {
        return analysisRepository.findByProjectId(projectId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void deleteAnalysis(Long id) {
        if (!analysisRepository.existsById(id)) {
            throw new NotFoundException("Analysis not found");
        }
        analysisRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse generateReport(Long analysisId) {
        Analysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new NotFoundException("Analysis not found"));

        Map<RiskLevel, Integer> vulnerabilityCountByRisk = analysis.getVulnerabilities().stream()
                .collect(Collectors.groupingBy(
                        v -> v.getSeverity() != null ? RiskLevel.valueOf(v.getSeverity().toUpperCase()) : RiskLevel.NONE,
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));

        Map<String, Integer> vulnerabilityCountByComponent = analysis.getVulnerabilities().stream()
                .flatMap(v -> v.getComponentVulnerabilities().stream())
                .collect(Collectors.groupingBy(
                        cv -> cv.getComponent().getName(),
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));

        Map<String, Integer> vulnerabilityCountByCve = analysis.getVulnerabilities().stream()
                .collect(Collectors.groupingBy(
                        v -> v.getCveId(),
                        Collectors.collectingAndThen(Collectors.counting(), Long::intValue)
                ));

        return ReportResponse.builder()
                .analysisId(analysis.getId())
                .analysisName(analysis.getName())
                .projectName(analysis.getProject().getName())
                .buildNumber(analysis.getBuild().getBuildNumber().toString())
                .vulnerabilityCountByRisk(vulnerabilityCountByRisk)
                .vulnerabilityCountByComponent(vulnerabilityCountByComponent)
                .vulnerabilityCountByCve(vulnerabilityCountByCve)
                .summary(generateSummary(vulnerabilityCountByRisk))
                .recommendations(generateRecommendations(vulnerabilityCountByRisk))
                .build();
    }

    private AnalysisResponse mapToResponse(Analysis analysis) {
        return AnalysisResponse.builder()
                .id(analysis.getId())
                .projectId(analysis.getProject().getId())
                .buildId(analysis.getBuild().getId())
                .name(analysis.getName())
                .description(analysis.getDescription())
                .analysisType(analysis.getAnalysisType())
                .status(analysis.getStatus())
                .startTime(analysis.getStartTime())
                .endTime(analysis.getEndTime())
                .duration(analysis.getDuration())
                .createdAt(analysis.getCreatedAt())
                .updatedAt(analysis.getUpdatedAt())
                .build();
    }

    private String generateSummary(Map<RiskLevel, Integer> vulnerabilityCountByRisk) {
        StringBuilder summary = new StringBuilder();
        summary.append("Analysis Summary:\n");
        summary.append("Total vulnerabilities: ").append(vulnerabilityCountByRisk.values().stream().mapToInt(Integer::intValue).sum()).append("\n");
        summary.append("By risk level:\n");
        vulnerabilityCountByRisk.forEach((risk, count) -> 
            summary.append("- ").append(risk).append(": ").append(count).append("\n")
        );
        return summary.toString();
    }

    private String generateRecommendations(Map<RiskLevel, Integer> vulnerabilityCountByRisk) {
        StringBuilder recommendations = new StringBuilder();
        recommendations.append("Recommendations:\n");
        
        if (vulnerabilityCountByRisk.getOrDefault(RiskLevel.CRITICAL, 0) > 0) {
            recommendations.append("- Address critical vulnerabilities immediately\n");
        }
        if (vulnerabilityCountByRisk.getOrDefault(RiskLevel.HIGH, 0) > 0) {
            recommendations.append("- Prioritize fixing high-risk vulnerabilities\n");
        }
        if (vulnerabilityCountByRisk.getOrDefault(RiskLevel.MEDIUM, 0) > 0) {
            recommendations.append("- Plan to address medium-risk vulnerabilities\n");
        }
        if (vulnerabilityCountByRisk.getOrDefault(RiskLevel.LOW, 0) > 0) {
            recommendations.append("- Consider addressing low-risk vulnerabilities in future updates\n");
        }
        
        return recommendations.toString();
    }
} 