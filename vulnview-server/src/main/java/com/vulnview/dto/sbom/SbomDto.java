package com.vulnview.dto.sbom;

import com.vulnview.dto.DependencyDto;
import com.vulnview.dto.sbom.component.ComponentDto;
import com.vulnview.dto.sbom.metadata.MetadataDto;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SbomDto {
    @NotBlank(message = "BOM format is required")
    private String bomFormat;

    @NotBlank(message = "Spec version is required")
    private String specVersion;

    @NotBlank(message = "Serial number is required")
    private String serialNumber;

    @NotNull(message = "Version is required")
    private Integer version;

    @Valid
    private MetadataDto metadata;

    @Valid
    private List<ComponentDto> components;

    @Valid
    private Set<DependencyDto> dependencies;

    private Long id;
    private String name;
    private String format;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 