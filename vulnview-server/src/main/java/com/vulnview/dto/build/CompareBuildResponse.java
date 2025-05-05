package com.vulnview.dto.build;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class CompareBuildResponse {
    private List<ComponentDiff> addedComponents;
    private List<ComponentDiff> removedComponents;
    private List<ComponentDiff> updatedComponents;

    @Data
    @Builder
    public static class ComponentDiff {
        private String name;
        private String version;
        private String packageUrl;
        private String license;
        private String riskLevel;
    }
} 