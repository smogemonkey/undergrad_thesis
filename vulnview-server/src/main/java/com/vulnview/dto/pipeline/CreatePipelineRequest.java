package com.vulnview.dto.pipeline;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class CreatePipelineRequest {
    @NotBlank(message = "Pipeline name is required")
    @Size(min = 1, max = 100, message = "Pipeline name must be between 1 and 100 characters")
    private String name;
} 