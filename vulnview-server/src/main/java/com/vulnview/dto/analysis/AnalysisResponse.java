package com.vulnview.dto.analysis;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisResponse {
    private Long id;
    private Long projectId;
    private Long buildId;
    private String name;
    private String description;
    private String analysisType;
    private String status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Long duration;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
} 