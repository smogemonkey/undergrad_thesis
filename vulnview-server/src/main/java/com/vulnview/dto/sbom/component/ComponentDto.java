package com.vulnview.dto.sbom.component;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.vulnview.dto.sbom.dependency.DependencyDto;
import com.vulnview.dto.sbom.vulnerability.VulnerabilityDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class ComponentDto {
    private String group;
    private String name;
    private String version;
    private String scope;
    private List<HashDto> hashes;
    private String purl;
    private String type;
    private String publisher;
    
    @JsonProperty(value = "bom-ref")
    private String bomRef;
    
    private List<PropertyDto> properties;
    private EvidenceDto evidence;
    
    // Add vulnerabilities for direct access in extract endpoint
    private List<VulnerabilityDto> vulnerabilities;
    
    private String description;
    private List<DependencyDto> dependencies;
} 