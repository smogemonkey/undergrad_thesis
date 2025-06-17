package com.vulnview.service.impl;

import com.vulnview.entity.Project;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class ProjectServiceImpl implements ProjectService {

    private final ProjectRepository projectRepository;
    private final EntityManager entityManager;

    @Override
    @Transactional
    public Project createProject(Project project) {
        Project saved = projectRepository.save(project);
        entityManager.refresh(saved);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public Project getProject(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Project> getUserProjects(Long userId) {
        return projectRepository.findByOwnerId(userId);
    }

    @Override
    @Transactional
    public Project updateProject(Long id, Project project) {
        Project existingProject = getProject(id);
        existingProject.setName(project.getName());
        existingProject.setDescription(project.getDescription());
        return projectRepository.save(existingProject);
    }

    @Override
    @Transactional
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getProjectDetails(Long projectId) {
        Project project = getProject(projectId);
        Map<String, Object> details = new HashMap<>();
        details.put("id", project.getId());
        details.put("name", project.getName());
        details.put("description", project.getDescription());
        details.put("ownerId", project.getOwnerId());
        details.put("createdAt", project.getCreatedAt());
        return details;
    }

    @Override
    public Optional<Project> findById(Long projectId) {
        return projectRepository.findById(projectId);
    }
} 