package com.vulnview.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class AiRemediationResponseDto {
    private String vulnerabilitySummary;
    private String componentContextSummary;
    private List<RemediationSuggestion> suggestedRemediations;
    private String overallRiskAssessment;
    private String disclaimer;

    @Data
    public static class RemediationSuggestion {
        private String type; // UPGRADE_VERSION, CONFIGURATION_CHANGE, CODE_MODIFICATION, WORKAROUND
        private String description;
        private String codeSnippet;
        private String confidence; // HIGH, MEDIUM, LOW
        private String estimatedEffort; // LOW, MEDIUM, HIGH
    }
} 