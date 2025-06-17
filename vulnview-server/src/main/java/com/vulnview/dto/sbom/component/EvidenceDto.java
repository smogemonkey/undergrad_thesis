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
public class EvidenceDto {
    private List<IdentityDto> identity;
    private List<LicenseDto> licenses;
    private List<CopyrightDto> copyright;
} 