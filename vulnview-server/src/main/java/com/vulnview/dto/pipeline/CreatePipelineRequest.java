package com.vulnview.dto.pipeline;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePipelineRequest {
    @NotBlank
    private String name;
    
    private String description;
    
    @NotBlank
    private String type;
} 