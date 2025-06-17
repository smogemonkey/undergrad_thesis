package com.vulnview.dto.sbom;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.vulnview.dto.sbom.component.ComponentDto;
import com.vulnview.dto.sbom.dependency.DependencyDto;
import com.vulnview.dto.sbom.metadata.MetadataDto;
import com.vulnview.dto.sbom.service.ServiceDto;
import com.vulnview.dto.sbom.vulnerability.VulnerabilityDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class CycloneDxBomDto {
    private String bomFormat;
    private String specVersion;
    private String serialNumber;
    private Integer version;
    private MetadataDto metadata;
    private List<ComponentDto> components;
    private List<DependencyDto> dependencies;
    private List<VulnerabilityDto> vulnerabilities;
    private List<ServiceDto> services;
}