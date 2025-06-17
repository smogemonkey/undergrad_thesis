package com.vulnview.dto;

import lombok.Data;
import lombok.Builder;
import java.util.Set;

@Data
@Builder
public class ComponentDto {
    private Long id;
    private String name;
    private String version;
    private String groupName;
    private String type;
    private String description;
    private String packageUrl;
    private String hash;
    private String evidence;
    private String riskLevel;
    private Set<VulnerabilityDto> vulnerabilities;
    private Long projectId;
    private Long sbomId;
    private Boolean isDirectDependency;
} 