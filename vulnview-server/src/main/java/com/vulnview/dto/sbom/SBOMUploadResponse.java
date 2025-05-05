package com.vulnview.dto.sbom;

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
    private int totalComponents;
    private int vulnerableComponents;
    private List<String> processedFiles;
    private List<String> errors;
    private String status;
    private String message;
} 