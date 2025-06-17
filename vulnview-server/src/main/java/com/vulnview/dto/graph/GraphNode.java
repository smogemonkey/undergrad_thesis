package com.vulnview.dto.graph;

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
public class GraphNode {
    private String id;
    private String name;
    private String version;
    private String type;
    private String riskLevel;
    private String purl;
    private int size;
    private int dependencies;
    private int dependents;
    private List<VulnerabilityInfo> vulnerabilityInfos;
    private Double x;
    private Double y;
    private Double fx;
    private Double fy;

    @Data
    @Builder
    public static class VulnerabilityInfo {
        private String id;
        private String severity;
        private String cvss;
        private String description;
    }
} 
 
 