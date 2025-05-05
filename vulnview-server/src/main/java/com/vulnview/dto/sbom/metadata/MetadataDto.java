package com.vulnview.dto.sbom.metadata;

import com.vulnview.dto.sbom.component.ComponentDto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MetadataDto {
    private String timestamp;
    private ComponentDto component;
} 