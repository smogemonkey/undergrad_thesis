package com.vulnview.dto.analysis;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisCreateRequest {
    @NotNull
    private Long projectId;
    
    @NotNull
    private Long buildId;
    
    @NotBlank
    private String name;
    
    private String description;
    
    @NotBlank
    private String analysisType;
} 