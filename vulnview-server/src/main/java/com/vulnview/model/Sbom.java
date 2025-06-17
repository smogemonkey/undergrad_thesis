package com.vulnview.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.HashMap;

@Data
public class Sbom {
    @JsonProperty("bomFormat")
    private String bomFormat;
    
    @JsonProperty("specVersion")
    private String specVersion;
    
    @JsonProperty("version")
    private Integer version;
    
    @JsonProperty("metadata")
    private Metadata metadata;
    
    @JsonProperty("components")
    private List<Component> components;
    
    @JsonProperty("dependencies")
    private List<Dependency> dependencies;
    
    @JsonProperty("vulnerabilities")
    private List<Vulnerability> vulnerabilities;
    
    @Data
    public static class Metadata {
        private Instant timestamp;
        private List<Tool> tools;
        private Component component;
    }
    
    @Data
    public static class Tool {
        private String vendor;
        private String name;
        private String version;
    }
    
    @Data
    public static class Component {
        private String type;
        private String name;
        private String version;
        
        @JsonProperty("bom-ref")
        private String bomRef;
        
        private List<License> licenses;
        private List<Vulnerability> vulnerabilities;
        private Map<String, String> properties;
    }
    
    @Data
    public static class License {
        private String id;
        private String name;
    }
    
    @Data
    public static class Dependency {
        private String ref;
        
        @JsonProperty("dependsOn")
        private List<String> dependsOn;
    }
    
    @Data
    public static class Vulnerability {
        private String id;
        private String source;
        private List<Rating> ratings;
        private List<Affect> affects;
        private String description;
        private String recommendation;
        private Map<String, String> properties = new HashMap<>();
        
        @Data
        public static class Rating {
            private String source;
            private String score;
            private String severity;
            private String method;
            private String vector;
        }
        
        @Data
        public static class Affect {
            private String ref;
        }
    }
} 