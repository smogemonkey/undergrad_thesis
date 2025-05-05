package com.vulnview.dto;

import com.vulnview.entity.Build;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class BuildDTO {
    private Long id;
    private String repository;
    private String branch;
    private int buildNumber;
    private String result;
    private long duration;
    private LocalDateTime startAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

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