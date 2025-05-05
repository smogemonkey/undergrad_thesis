package com.vulnview.service;

import com.vulnview.dto.project.ProjectCreateRequest;
import com.vulnview.dto.project.ProjectResponse;
import com.vulnview.dto.project.ProjectUpdateRequest;
import com.vulnview.entity.Component;
import com.vulnview.entity.Project;
import com.vulnview.entity.RiskLevel;
import com.vulnview.entity.User;
import com.vulnview.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public Page<ProjectResponse> getAllProjects(Pageable pageable) {
        User currentUser = userService.getCurrentUser();
        return projectRepository.findByOwner(currentUser, pageable)
                .map(this::mapToProjectResponse);
    }

    @Transactional(readOnly = true)
    public ProjectResponse getProjectById(Long id) {
        Project project = findProjectAndVerifyOwnership(id);
        return mapToProjectResponse(project);
    }

    @Transactional
    public ProjectResponse createProject(ProjectCreateRequest request) {
        User currentUser = userService.getCurrentUser();
        
        if (projectRepository.existsByNameAndOwner(request.getName(), currentUser)) {
            throw new IllegalArgumentException("Project with this name already exists");
        }

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .version(request.getVersion())
                .owner(currentUser)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        return mapToProjectResponse(projectRepository.save(project));
    }

    @Transactional
    public ProjectResponse updateProject(Long id, ProjectUpdateRequest request) {
        Project project = findProjectAndVerifyOwnership(id);
        
        if (request.getName() != null && !request.getName().equals(project.getName())) {
            if (projectRepository.existsByNameAndOwner(request.getName(), project.getOwner())) {
                throw new IllegalArgumentException("Project with this name already exists");
            }
            project.setName(request.getName());
        }

        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }

        if (request.getVersion() != null) {
            project.setVersion(request.getVersion());
        }

        project.setUpdatedAt(LocalDateTime.now());
        return mapToProjectResponse(projectRepository.save(project));
    }

    @Transactional
    public void deleteProject(Long id) {
        Project project = findProjectAndVerifyOwnership(id);
        projectRepository.delete(project);
    }

    @Transactional(readOnly = true)
    public Page<ProjectResponse> searchProjects(String query, Pageable pageable) {
        return projectRepository.searchProjects(query, pageable)
                .map(this::mapToProjectResponse);
    }

    private Project findProjectAndVerifyOwnership(Long id) {
        Project project = projectRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Project not found"));

        User currentUser = userService.getCurrentUser();
        if (!project.getOwner().getId().equals(currentUser.getId())) {
            throw new IllegalArgumentException("You don't have access to this project");
        }

        return project;
    }

    private ProjectResponse mapToProjectResponse(Project project) {
        return ProjectResponse.builder()
                .id(project.getId())
                .name(project.getName())
                .description(project.getDescription())
                .version(project.getVersion())
                .ownerUsername(project.getOwner().getUsername())
                .totalComponents(project.getComponents().size())
                .riskLevelCounts(calculateRiskLevelCounts(project.getComponents()))
                .createdAt(project.getCreatedAt())
                .updatedAt(project.getUpdatedAt())
                .build();
    }

    private Map<RiskLevel, Integer> calculateRiskLevelCounts(Set<Component> components) {
        Map<RiskLevel, Integer> counts = new EnumMap<>(RiskLevel.class);
        for (RiskLevel level : RiskLevel.values()) {
            counts.put(level, 0);
        }

        for (Component component : components) {
            RiskLevel level = component.getRiskLevel();
            counts.put(level, counts.get(level) + 1);
        }

        return counts;
    }
} 