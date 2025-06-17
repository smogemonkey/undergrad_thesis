package com.vulnview.dto;

import lombok.Data;

@Data
public class AiRemediationRequestDto {
    private String vulnerabilityDbId;
    private String affectedComponentPurl;
    private String projectContextDescription;
} 