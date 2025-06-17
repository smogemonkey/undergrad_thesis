package com.vulnview.dto.ai;

import lombok.Data;
import java.util.List;

@Data
public class AiAlternativeResponseDto {
    private String currentPackageSummary;
    private String vulnerabilitySummary;
    private List<AlternativePackage> suggestedAlternatives;
    private String overallRecommendation;
    private String disclaimer;

    @Data
    public static class AlternativePackage {
        private String name;
        private String version;
        private String purl;
        private String description;
        private List<String> securityBenefits;
        private String compatibilityNotes;
        private String migrationEffort;
        private String confidence;
    }
} 