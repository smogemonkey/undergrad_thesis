package com.vulnview.dto.analysis;

import com.vulnview.entity.RiskLevel;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AnalysisRequest {
    @NotNull(message = "Risk level is required")
    private RiskLevel riskLevel;
    
    private String notes;
} 