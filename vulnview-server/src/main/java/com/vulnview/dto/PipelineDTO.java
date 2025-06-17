package com.vulnview.dto;

import com.vulnview.entity.Pipeline;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PipelineDTO {
    private Long id;
    private Long projectId;
    private String name;
    private String description;
    private String type;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static PipelineDTO from(Pipeline pipeline) {
        return PipelineDTO.builder()
                .id(pipeline.getId())
                .projectId(pipeline.getProject().getId())
                .name(pipeline.getName())
                .description(pipeline.getDescription())
                .type(pipeline.getType())
                .status(pipeline.getStatus())
                .createdAt(pipeline.getCreatedAt())
                .updatedAt(pipeline.getUpdatedAt())
                .build();
    }
} 