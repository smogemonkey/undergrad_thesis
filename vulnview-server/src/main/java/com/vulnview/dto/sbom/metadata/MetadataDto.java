package com.vulnview.dto.sbom.metadata;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.annotation.JsonDeserialize;
import com.vulnview.dto.sbom.component.ComponentDto;
import com.vulnview.dto.sbom.metadata.deserializer.MetadataDtoDeserializer;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
@JsonDeserialize(using = MetadataDtoDeserializer.class)
public class MetadataDto {
    private String timestamp;
    private List<ToolDto> tools;
    private List<AuthorDto> authors;
    private List<LifecycleDto> lifecycles;
    private ComponentDto component;
    private List<PropertyDto> properties;
} 