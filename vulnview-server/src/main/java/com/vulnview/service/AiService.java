package com.vulnview.service;

import com.vulnview.dto.ai.*;
import com.vulnview.dto.ai.AiSummaryResponse;
import com.vulnview.entity.Component;
import com.vulnview.entity.User;
import com.vulnview.entity.Vulnerability;
import com.vulnview.entity.Project;
import java.util.List;
import java.util.Map;

public interface AiService {
    /**
     * Get AI-powered remediation suggestions for a vulnerability
     * @param request The request containing vulnerability and component information
     * @return AI-generated remediation suggestions
     */
    AiRemediationResponseDto getRemediationSuggestion(AiRemediationRequestDto requestDto);

    /**
     * Get AI-powered alternative package suggestions
     * @param request The request containing component information and requirements
     * @return AI-generated alternative package suggestions
     */
    AiAlternativeResponseDto suggestAlternativePackages(AiAlternativeRequestDto requestDto);

    void triggerEnrichmentForComponent(Long componentId);
    void triggerEnrichmentForBuild(Long buildId);

    List<Map<String, Object>> getVulnerableComponents(Long sbomId);
    Map<String, Object> analyzeSbom(Long sbomId);

    /**
     * Generate a vulnerability summary for a list of components using AI
     * @param components List of components to analyze
     * @return AI-generated summary response
     */
    AiSummaryResponse generateVulnerabilitySummary(List<Component> components);

    String getVulnerabilitySummary(List<Vulnerability> vulnerabilities);

    String getRecommendation(Long componentId, Long vulnerabilityId);

    String getRemediation(Long componentId, String vulnerabilityId);

    String getFix(Long componentId, Long vulnerabilityId);
    
    List<Map<String, Object>> getProjectSolutions(Long projectId);

    void generateProjectSummary(Project project);
} 