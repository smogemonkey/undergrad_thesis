package com.vulnview.dto.admin;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class SystemStatsDto {
    private long totalUsers;
    private long totalProjects;
    private long totalBuilds;
    private long totalVulnerabilities;
    private long activeUsers;
    private long activeProjects;
    private long criticalVulnerabilities;
    private long highVulnerabilities;
} 
 