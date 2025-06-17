package com.vulnview.dto.license;

import com.vulnview.entity.RiskLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicenseDto {
    private String id;
    private String name;
    private String description;
    private String url;
    private RiskLevel riskLevel;
    private String permissions;
    private String conditions;
    private String limitations;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 
 
 