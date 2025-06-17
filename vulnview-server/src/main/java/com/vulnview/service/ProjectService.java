package com.vulnview.service;

import com.vulnview.entity.Project;
import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ProjectService {
    Project createProject(Project project);
    Project getProject(Long id);
    List<Project> getAllProjects();
    List<Project> getUserProjects(Long userId);
    Project updateProject(Long id, Project project);
    void deleteProject(Long id);
    Map<String, Object> getProjectDetails(Long projectId);
    Optional<Project> findById(Long projectId);
} 