package com.vulnview.dto.ai;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlternativePackageDto {
    private String name;
    private String suggestedVersion;
    private String purl;
    private String licenseSpdxId;
    private String reasoning;
    private Double confidenceScore;
    private String notes;
} 