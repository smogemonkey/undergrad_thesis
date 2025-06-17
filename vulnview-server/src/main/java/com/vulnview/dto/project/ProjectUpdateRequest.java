package com.vulnview.dto.project;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProjectUpdateRequest {
    @NotBlank(message = "Project name is required")
    private String name;

    private String description;

    @NotBlank(message = "Project version is required")
    private String version;
} 