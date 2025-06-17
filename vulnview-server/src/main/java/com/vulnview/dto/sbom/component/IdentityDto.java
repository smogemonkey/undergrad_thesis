package com.vulnview.dto.sbom.component;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
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
public class IdentityDto {
    private String field;
    private String confidence;
    private List<MethodDto> methods;
    private String value;
    private String concludedValue;
} 