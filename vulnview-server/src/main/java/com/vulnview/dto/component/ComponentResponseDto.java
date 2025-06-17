package com.vulnview.dto.component;

import com.vulnview.entity.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentResponseDto {
    private Long id;
    private String name;
    private String version;
    private String groupName;
    private String type;
    private String description;
    private String packageUrl;
    private String license;
    private String hash;
    private String evidence;
    private RiskLevel riskLevel;
    private Long projectId;
    private Long sbomId;
    private Set<Long> vulnerabilityIds;
    private Set<Long> dependencyIds;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 