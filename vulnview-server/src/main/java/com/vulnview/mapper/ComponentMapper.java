package com.vulnview.mapper;

import com.vulnview.dto.ComponentDto;
import com.vulnview.dto.VulnerabilityDto;
import com.vulnview.entity.Component;
import com.vulnview.entity.Vulnerability;
import org.springframework.stereotype.Service;

import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ComponentMapper {
    
    public ComponentDto toDto(Component component) {
        if (component == null) {
            return null;
        }

        Set<VulnerabilityDto> vulnerabilityDtos = null;
        if (component.getComponentVulnerabilities() != null) {
            vulnerabilityDtos = component.getComponentVulnerabilities().stream()
                .map(cv -> {
                    Vulnerability v = cv.getVulnerability();
                    return VulnerabilityDto.builder()
                        .id(v.getId())
                        .cveId(v.getCveId())
                        .title(v.getTitle())
                        .description(v.getDescription())
                        .publishedDate(v.getPublishedDate() != null ? v.getPublishedDate().toString() : null)
                        .lastModifiedDate(v.getLastModifiedDate() != null ? v.getLastModifiedDate().toString() : null)
                        .build();
                })
                .collect(Collectors.toSet());
        }

        return ComponentDto.builder()
            .id(component.getId())
            .name(component.getName())
            .version(component.getVersion())
            .groupName(component.getGroupName())
            .type(component.getType())
            .description(component.getDescription())
            .packageUrl(component.getPackageUrl())
            .hash(component.getHash())
            .evidence(component.getEvidence())
            .riskLevel(component.getRiskLevel().toString())
            .vulnerabilities(vulnerabilityDtos)
            .projectId(component.getProject() != null ? component.getProject().getId() : null)
            .sbomId(component.getSbom() != null ? component.getSbom().getId() : null)
            .isDirectDependency(component.getIsDirectDependency())
            .build();
    }
} 
 
 