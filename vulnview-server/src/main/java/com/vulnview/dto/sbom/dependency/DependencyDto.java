package com.vulnview.dto.sbom.dependency;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DependencyDto {
    @NotBlank(message = "Reference is required")
    private String ref;

    private List<String> dependsOn;
} 