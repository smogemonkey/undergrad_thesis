package com.vulnview.dto;

import com.vulnview.entity.Build;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BuildDTO {
    private Long id;
    private Long projectId;
    private Long pipelineId;
    private String repository;
    private String branch;
    private Integer buildNumber;
    private String result;
    private Long duration;
    private LocalDateTime startAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private String sbomId;

    public static BuildDTO from(Build build) {
        return BuildDTO.builder()
                .id(build.getId())
                .repository(build.getRepository())
                .branch(build.getBranch())
                .buildNumber(build.getBuildNumber())
                .result(build.getResult())
                .duration(build.getDuration())
                .startAt(build.getStartAt())
                .createdAt(build.getCreatedAt())
                .updatedAt(build.getUpdatedAt())
                .build();
    }
} 