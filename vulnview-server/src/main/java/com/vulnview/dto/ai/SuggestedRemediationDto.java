package com.vulnview.dto.ai;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class SuggestedRemediationDto {
    private String type; // UPGRADE_VERSION, CONFIGURATION_CHANGE, CODE_MODIFICATION, WORKAROUND
    private String description;
    private String codeSnippet;
    private String confidence; // HIGH, MEDIUM, LOW
    private String estimatedEffort; // LOW, MEDIUM, HIGH
} 