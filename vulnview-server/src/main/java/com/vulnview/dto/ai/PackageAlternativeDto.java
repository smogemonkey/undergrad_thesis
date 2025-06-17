package com.vulnview.dto.ai;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PackageAlternativeDto {
    private String packageName;
    private String version;
    private String description;
    private String advantages;
    private String disadvantages;
    private Double migrationDifficulty; // 0.0 to 1.0, where 0.0 is easy and 1.0 is hard
    private Double confidence; // 0.0 to 1.0, where 0.0 is low and 1.0 is high
} 
 