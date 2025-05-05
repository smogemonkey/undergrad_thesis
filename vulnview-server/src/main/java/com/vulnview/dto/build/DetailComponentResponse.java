package com.vulnview.dto.build;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class DetailComponentResponse {
    private String name;
    private String version;
    private String packageUrl;
    private String license;
    private String riskLevel;
    private List<String> vulnerabilities;
} 