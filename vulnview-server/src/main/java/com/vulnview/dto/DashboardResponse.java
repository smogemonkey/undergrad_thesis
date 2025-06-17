package com.vulnview.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardResponse {
    private Long userId;
    private String username;
    private String email;
    private String role;
    private List<ProjectInfo> projects;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ProjectInfo {
        private Long id;
        private String name;
        private String description;
        private List<RepositoryInfo> repositories;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class RepositoryInfo {
        private Long id;
        private String name;
        private String description;
        private String defaultBranch;
        private List<SbomInfo> sboms;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class SbomInfo {
        private Long id;
        private String version;
        private LocalDateTime createdAt;
    }
} 