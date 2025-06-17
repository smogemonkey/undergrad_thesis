package com.vulnview.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RepositoryDto {
    private Long id;
    private String name;
    private String description;
    private String defaultBranch;
    private String owner;
    private String localPath;
    private LocalDateTime lastSync;
} 