package com.vulnview.dto.ai;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class AiRemediationRequestDto {
    private String vulnerabilityDbId;
    private String affectedComponentPurl;
    private String affectedComponentVersion;
    private String projectContextDescription;
} 