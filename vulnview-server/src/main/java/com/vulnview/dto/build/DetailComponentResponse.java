package com.vulnview.dto.build;

import com.vulnview.dto.vulnerability.VulnerabilityResponse;
import com.vulnview.entity.RiskLevel;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DetailComponentResponse {
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
    private List<VulnerabilityResponse> vulnerabilities;
} 