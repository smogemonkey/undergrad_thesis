package com.vulnview.dto;

import com.vulnview.entity.Pipeline;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class PipelineDTO {
    private Long id;
    private String name;
    private String projectName;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PipelineDTO from(Pipeline pipeline) {
        return PipelineDTO.builder()
                .id(pipeline.getId())
                .name(pipeline.getName())
                .projectName(pipeline.getProject().getName())
                .createdAt(pipeline.getCreatedAt())
                .updatedAt(pipeline.getUpdatedAt())
                .build();
    }
} 