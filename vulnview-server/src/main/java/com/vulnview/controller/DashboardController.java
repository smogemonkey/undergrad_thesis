package com.vulnview.controller;

import com.vulnview.dto.DashboardResponse;
import com.vulnview.entity.Project;
import com.vulnview.entity.Repository;
import com.vulnview.entity.Sbom;
import com.vulnview.entity.User;
import com.vulnview.service.ProjectService;
import com.vulnview.service.RepositoryService;
import com.vulnview.service.SbomService;
import com.vulnview.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import com.vulnview.exception.NotFoundException;
import com.vulnview.dto.RepositoryDto;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final UserService userService;
    private final ProjectService projectService;
    private final RepositoryService repositoryService;
    private final SbomService sbomService;

    @GetMapping
    public ResponseEntity<DashboardResponse> getDashboard(@AuthenticationPrincipal User user) {
        List<Project> projects;
        
        // If user is admin, get all projects, otherwise get only user's projects
        if ("ADMIN".equals(user.getSystemRole())) {
            projects = projectService.getAllProjects();
        } else {
            projects = projectService.getUserProjects(user.getId());
        }

        // For each project, get its repositories and their SBOMs
        List<DashboardResponse.ProjectInfo> projectInfos = projects.stream()
            .map(project -> {
                List<Repository> repositories = repositoryService.getProjectRepositories(project.getId());
                
                List<DashboardResponse.RepositoryInfo> repositoryInfos = repositories.stream()
                    .map(repo -> {
                        List<Sbom> sboms = sbomService.getRepositorySboms(repo.getId());
                        return new DashboardResponse.RepositoryInfo(
                            repo.getId(),
                            repo.getName(),
                            repo.getDescription(),
                            repo.getDefaultBranch(),
                            sboms.stream()
                                .map(sbom -> new DashboardResponse.SbomInfo(
                                    sbom.getId(),
                                    sbom.getVersion(),
                                    sbom.getCreatedAt()
                                ))
                                .collect(Collectors.toList())
                        );
                    })
                    .collect(Collectors.toList());

                return new DashboardResponse.ProjectInfo(
                    project.getId(),
                    project.getName(),
                    project.getDescription(),
                    repositoryInfos
                );
            })
            .collect(Collectors.toList());

        return ResponseEntity.ok(new DashboardResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getSystemRole(),
            projectInfos
        ));
    }

    @GetMapping("/projects")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<Project>> getUserProjects(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.getUserProjects(user.getId()));
    }

    @GetMapping("/projects/{projectId}/repositories")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<?> getProjectRepositories(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User user) {
        try {
            // Check if user has access to project
            Optional<Project> projectOpt = projectService.findById(projectId);
            if (projectOpt.isEmpty()) {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Project not found"));
            }

            Project project = projectOpt.get();
            if (!project.getOwnerId().equals(user.getId()) && 
                !project.getMemberships().stream().anyMatch(m -> m.getUser().getId().equals(user.getId()))) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "No access to this project"));
            }

            List<Repository> repos = repositoryService.getProjectRepositories(projectId);
            List<RepositoryDto> dtos = repos.stream()
                .map(r -> new RepositoryDto(
                    r.getId(),
                    r.getName(),
                    r.getDescription(),
                    r.getDefaultBranch(),
                    r.getOwner(),
                    r.getLocalPath(),
                    r.getLastSync()
                ))
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(dtos);
        } catch (NotFoundException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            e.printStackTrace(); // Log the error for debugging
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    @GetMapping("/projects/{projectId}")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<Map<String, Object>> getProjectDetails(
            @PathVariable Long projectId,
            @AuthenticationPrincipal User user) {
        return ResponseEntity.ok(projectService.getProjectDetails(projectId));
    }

    @GetMapping("/repositories")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<Repository>> getAllRepositories() {
        return ResponseEntity.ok(repositoryService.getAllRepositories());
    }
} 