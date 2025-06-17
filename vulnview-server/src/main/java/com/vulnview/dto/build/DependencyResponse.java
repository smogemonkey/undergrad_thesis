package com.vulnview.dto.build;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DependencyResponse {
    private String name;
    private String version;
    private String packageUrl;
    private String license;
    private String riskLevel;
    private int vulnerabilityCount;
} 