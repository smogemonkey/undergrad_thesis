package com.vulnview.dto.build;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DependencyResponse {
    private String name;
    private String version;
    private String packageUrl;
    private String license;
    private String riskLevel;
} 