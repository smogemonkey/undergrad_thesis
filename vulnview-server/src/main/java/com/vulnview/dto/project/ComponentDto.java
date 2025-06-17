package com.vulnview.dto.project;

import com.vulnview.dto.VulnerabilityDto;
import com.vulnview.dto.license.LicenseDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentDto {
    private Long id;
    private String name;
    private String version;
    private String packageUrl;
    private String license;
    private LicenseDto licenseDetails;
    private String riskLevel;
    private String hash;
    private String evidence;
    private Set<VulnerabilityDto> vulnerabilities;
}