package com.vulnview.dto.sbom.component;

import com.vulnview.dto.sbom.vulnerability.VulnerabilityDto;
import jakarta.validation.constraints.NotBlank;
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
public class ComponentDto {
    @NotBlank(message = "Type is required")
    private String type;

    @NotBlank(message = "Name is required")
    private String name;

    private String group;

    @NotBlank(message = "Version is required")
    private String version;

    private String description;
    private String scope;
    private Map<String, String> hashes;
    private List<String> licenses;
    private String purl;
    private List<String> externalReferences;
    private String bomRef;
    private Map<String, Object> evidence;
    private Map<String, String> properties;
    private List<VulnerabilityDto> vulnerabilities;
    private String hash;
    private String evidenceString;
} 