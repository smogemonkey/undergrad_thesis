package com.vulnview.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SBOMUploadResponse {
    private String projectName;
    private String projectVersion;
    private Long projectId;
    private Long sbomId;
    private Integer totalComponents;
    private Integer vulnerableComponents;
    private Integer vulnerabilitiesFound;
    private String status;
    private String message;
    private List<String> errors;
} 