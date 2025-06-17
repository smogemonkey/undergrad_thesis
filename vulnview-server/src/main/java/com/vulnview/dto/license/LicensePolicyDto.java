package com.vulnview.dto.license;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LicensePolicyDto {
    private Long id;
    private String name;
    private String description;
    private boolean active;
    private List<LicensePolicyRuleDto> rules;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String createdBy;
    private String updatedBy;
} 
 
 