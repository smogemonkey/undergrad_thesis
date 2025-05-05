package com.vulnview.service.impl;

import com.vulnview.dto.analysis.AnalysisCreateRequest;
import com.vulnview.dto.analysis.AnalysisResponse;
import com.vulnview.dto.analysis.ReportResponse;
import com.vulnview.entity.Analysis;
import com.vulnview.entity.Project;
import com.vulnview.entity.Vulnerability;
import com.vulnview.entity.RiskLevel;
import com.vulnview.repository.AnalysisRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.service.AnalysisService;
import jakarta.persistence.EntityNotFoundException;
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

    @Override
    @Transactional
    public AnalysisResponse createAnalysis(AnalysisCreateRequest request) {
        Project project = projectRepository.findById(request.getProjectId())
                .orElseThrow(() -> new EntityNotFoundException("Project not found"));

        Analysis analysis = Analysis.builder()
                .project(project)
                .name(request.getName())
                .description(request.getDescription())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        analysis = analysisRepository.save(analysis);
        return mapToResponse(analysis);
    }

    @Override
    @Transactional(readOnly = true)
    public AnalysisResponse getAnalysis(Long id) {
        Analysis analysis = analysisRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Analysis not found"));
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
            throw new EntityNotFoundException("Analysis not found");
        }
        analysisRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportResponse generateReport(Long analysisId) {
        Analysis analysis = analysisRepository.findById(analysisId)
                .orElseThrow(() -> new EntityNotFoundException("Analysis not found"));

        Map<RiskLevel, Integer> vulnerabilityCountByRisk = analysis.getProject().getVulnerabilities().stream()
                .collect(Collectors.groupingBy(Vulnerability::getRiskLevel, Collectors.summingInt(e -> 1)));

        Map<String, Integer> vulnerabilityCountByComponent = analysis.getProject().getVulnerabilities().stream()
                .flatMap(v -> v.getAffectedComponents().stream())
                .collect(Collectors.groupingBy(String::toString, Collectors.summingInt(e -> 1)));

        Map<String, Integer> vulnerabilityCountByCve = analysis.getProject().getVulnerabilities().stream()
                .collect(Collectors.groupingBy(Vulnerability::getCveId, Collectors.summingInt(e -> 1)));

        return ReportResponse.builder()
                .id(analysis.getId())
                .analysisId(analysisId)
                .title("Vulnerability Analysis Report - " + analysis.getName())
                .summary("Analysis of vulnerabilities in project: " + analysis.getProject().getName())
                .vulnerabilityCountByRisk(vulnerabilityCountByRisk)
                .vulnerabilityCountByComponent(vulnerabilityCountByComponent)
                .vulnerabilityCountByCve(vulnerabilityCountByCve)
                .recommendations(generateRecommendations(vulnerabilityCountByRisk))
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
    }

    private AnalysisResponse mapToResponse(Analysis analysis) {
        return AnalysisResponse.builder()
                .id(analysis.getId())
                .projectId(analysis.getProject().getId())
                .name(analysis.getName())
                .description(analysis.getDescription())
                .vulnerabilityCountByRisk(analysis.getProject().getVulnerabilities().stream()
                        .collect(Collectors.groupingBy(Vulnerability::getRiskLevel, Collectors.summingInt(e -> 1))))
                .vulnerabilityCountByComponent(analysis.getProject().getVulnerabilities().stream()
                        .flatMap(v -> v.getAffectedComponents().stream())
                        .collect(Collectors.groupingBy(String::toString, Collectors.summingInt(e -> 1))))
                .vulnerabilityCountByCve(analysis.getProject().getVulnerabilities().stream()
                        .collect(Collectors.groupingBy(Vulnerability::getCveId, Collectors.summingInt(e -> 1))))
                .createdAt(analysis.getCreatedAt())
                .updatedAt(analysis.getUpdatedAt())
                .build();
    }

    private String generateRecommendations(Map<RiskLevel, Integer> vulnerabilityCountByRisk) {
        StringBuilder recommendations = new StringBuilder();
        
        if (vulnerabilityCountByRisk.getOrDefault(RiskLevel.CRITICAL, 0) > 0) {
            recommendations.append("Critical vulnerabilities detected. Immediate action required.\n");
        }
        if (vulnerabilityCountByRisk.getOrDefault(RiskLevel.HIGH, 0) > 0) {
            recommendations.append("High-risk vulnerabilities present. Address these as soon as possible.\n");
        }
        if (vulnerabilityCountByRisk.getOrDefault(RiskLevel.MEDIUM, 0) > 0) {
            recommendations.append("Medium-risk vulnerabilities found. Plan to address these in upcoming sprints.\n");
        }
        if (vulnerabilityCountByRisk.getOrDefault(RiskLevel.LOW, 0) > 0) {
            recommendations.append("Low-risk vulnerabilities identified. Consider addressing these in future updates.\n");
        }

        return recommendations.toString();
    }
} 