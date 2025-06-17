package com.vulnview.dto.pipeline;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
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
    private String riskLevel;
    private List<String> vulnerabilities;
} 