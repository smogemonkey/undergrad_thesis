package com.vulnview.dto.sbom;

import lombok.Data;

import java.util.List;

@Data
public class SbomDto {
    private String format;
    private String version;
    private List<ComponentDto> components;

    @Data
    public static class ComponentDto {
        private String name;
        private String version;
        private String packageUrl;
        private String license;
        private List<String> vulnerabilities;
    }
} 