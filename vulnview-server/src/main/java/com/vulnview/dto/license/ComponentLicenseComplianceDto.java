package com.vulnview.dto.license;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComponentLicenseComplianceDto {
    private Long id;
    private Long componentId;
    private String componentName;
    private String componentVersion;
    private Long policyId;
    private String policyName;
    private String complianceStatus;
    private LocalDateTime lastCheckedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 
 
 