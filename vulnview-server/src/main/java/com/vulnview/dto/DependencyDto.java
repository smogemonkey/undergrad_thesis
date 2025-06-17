package com.vulnview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DependencyDto {
    private Long id;
    private String name;
    private String version;
    private String packageUrl;
    private String license;
    private String riskLevel;
    private String hash;
} 