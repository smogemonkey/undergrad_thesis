package com.vulnview.controller;

import com.vulnview.entity.Project;
import com.vulnview.service.AuthenticationService;
import com.vulnview.service.ProjectService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

import com.vulnview.dto.ProjectDTO;

@RestController
@RequestMapping("/api/v1/projects")
public class ProjectController extends BaseController {

    private final ProjectService projectService;

    public ProjectController(AuthenticationService authenticationService, ProjectService projectService) {
        super(authenticationService);
        this.projectService = projectService;
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Project> getProject(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProject(id));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ProjectDTO> createProject(@RequestBody com.vulnview.dto.project.ProjectCreateRequest request) {
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        // Set ownerId to current user
        project.setOwnerId(getCurrentUserId());
        Project saved = projectService.createProject(project);
        return ResponseEntity.ok(ProjectDTO.from(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody com.vulnview.dto.project.ProjectUpdateRequest request) {
        Project project = new Project();
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        return ResponseEntity.ok(projectService.updateProject(id, project));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok().build();
    }
} 