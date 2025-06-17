package com.vulnview.dto.sbom;

import com.vulnview.dto.component.ComponentResponseDto;
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
public class SbomResponseDto {
    private Long id;
    private Long buildId;
    private String bomFormat;
    private String specVersion;
    private String serialNumber;
    private String version;
    private List<ComponentResponseDto> components;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 