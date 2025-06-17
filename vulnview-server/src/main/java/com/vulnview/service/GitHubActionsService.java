package com.vulnview.service;

import com.vulnview.entity.Project;
import com.vulnview.entity.Build;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.repository.BuildRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class GitHubActionsService {
    
    private final ProjectRepository projectRepository;
    private final BuildRepository buildRepository;
    private final RestTemplate restTemplate;

    @Value("${github.api.url}")
    private String githubApiUrl;

    @Value("${github.token}")
    private String githubToken;

    @Transactional
    public void handleWorkflowRunEvent(Map<String, Object> payload) {
        String repositoryName = (String) payload.get("repository");
        String branch = (String) payload.get("branch");
        String status = (String) payload.get("status");
        String conclusion = (String) payload.get("conclusion");
        Long runId = Long.parseLong(payload.get("run_id").toString());

        Project project = projectRepository.findByName(repositoryName)
            .orElseThrow(() -> new RuntimeException("Project not found: " + repositoryName));

        Build build = new Build();
        build.setProject(project);
        build.setRepository(repositoryName);
        build.setBranch(branch);
        build.setBuildNumber(runId.intValue());
        build.setResult(conclusion);
        build.setStartAt(LocalDateTime.now());
        build.setEndAt(LocalDateTime.now());

        buildRepository.save(build);
    }

    @Transactional
    public void handleCheckRunEvent(Map<String, Object> payload) {
        String repositoryName = (String) payload.get("repository");
        String branch = (String) payload.get("branch");
        String status = (String) payload.get("status");
        String conclusion = (String) payload.get("conclusion");
        Long checkRunId = Long.parseLong(payload.get("check_run_id").toString());

        Project project = projectRepository.findByName(repositoryName)
            .orElseThrow(() -> new RuntimeException("Project not found: " + repositoryName));

        Build build = buildRepository.findByBuildNumber(checkRunId.intValue())
            .orElseGet(() -> {
                Build newBuild = new Build();
                newBuild.setProject(project);
                newBuild.setRepository(repositoryName);
                newBuild.setBranch(branch);
                newBuild.setBuildNumber(checkRunId.intValue());
                return newBuild;
            });

        build.setResult(conclusion);
        build.setEndAt(LocalDateTime.now());

        buildRepository.save(build);
    }

    public void createWorkflow(Map<String, Object> payload) {
        String repository = (String) payload.get("repository");
        String workflowContent = (String) payload.get("workflow_content");

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "token " + githubToken);
        headers.set("Accept", "application/vnd.github.v3+json");

        Map<String, Object> requestBody = Map.of(
            "message", "Add VulnView workflow",
            "content", workflowContent,
            "branch", "main"
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        String url = String.format("%s/repos/%s/contents/.github/workflows/vulnview.yml", githubApiUrl, repository);
        
        restTemplate.exchange(url, HttpMethod.PUT, request, Map.class);
    }

    public void updateWorkflow(Map<String, Object> payload) {
        String repository = (String) payload.get("repository");
        String workflowContent = (String) payload.get("workflow_content");

        HttpHeaders headers = new HttpHeaders();
        headers.set("Authorization", "token " + githubToken);
        headers.set("Accept", "application/vnd.github.v3+json");

        // First, get the current file to get its SHA
        String getUrl = String.format("%s/repos/%s/contents/.github/workflows/vulnview.yml", githubApiUrl, repository);
        Map<String, Object> currentFile = restTemplate.exchange(getUrl, HttpMethod.GET, 
            new HttpEntity<>(headers), Map.class).getBody();

        Map<String, Object> requestBody = Map.of(
            "message", "Update VulnView workflow",
            "content", workflowContent,
            "sha", currentFile.get("sha"),
            "branch", "main"
        );

        HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
        String url = String.format("%s/repos/%s/contents/.github/workflows/vulnview.yml", githubApiUrl, repository);
        
        restTemplate.exchange(url, HttpMethod.PUT, request, Map.class);
    }
} 