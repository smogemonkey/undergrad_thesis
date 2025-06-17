package com.vulnview.service;

import com.vulnview.entity.Project;
import com.vulnview.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.FileCopyUtils;

import java.io.IOException;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubWorkflowService {
    
    private final ProjectRepository projectRepository;
    private final GitHubActionsService githubActionsService;

    @Transactional
    public void createWorkflowForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

        try {
            String workflowContent = loadWorkflowTemplate();
            Map<String, Object> payload = new HashMap<>();
            payload.put("repository", project.getName());
            payload.put("workflow_content", workflowContent);
            
            githubActionsService.createWorkflow(payload);
        } catch (IOException e) {
            throw new RuntimeException("Failed to create workflow", e);
        }
    }

    @Transactional
    public void updateWorkflowForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new RuntimeException("Project not found"));

        try {
            String workflowContent = loadWorkflowTemplate();
            Map<String, Object> payload = new HashMap<>();
            payload.put("repository", project.getName());
            payload.put("workflow_content", workflowContent);
            
            githubActionsService.updateWorkflow(payload);
        } catch (IOException e) {
            throw new RuntimeException("Failed to update workflow", e);
        }
    }

    private String loadWorkflowTemplate() throws IOException {
        ClassPathResource resource = new ClassPathResource("templates/github-workflow-template.yml");
        try (Reader reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
            return FileCopyUtils.copyToString(reader);
        }
    }
} 