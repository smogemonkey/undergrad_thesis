package com.vulnview.controller;

import com.vulnview.service.GitHubActionsService;
import com.vulnview.service.GitHubWorkflowService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/github")
@RequiredArgsConstructor
public class GitHubActionsController {

    private final GitHubActionsService githubActionsService;
    private final GitHubWorkflowService githubWorkflowService;

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestHeader("X-GitHub-Event") String eventType,
                                            @RequestBody Map<String, Object> payload) {
        switch (eventType) {
            case "workflow_run":
                githubActionsService.handleWorkflowRunEvent(payload);
                break;
            case "check_run":
                githubActionsService.handleCheckRunEvent(payload);
                break;
        }
        return ResponseEntity.ok().build();
    }

    @PostMapping("/projects/{projectId}/workflow")
    public ResponseEntity<Void> createWorkflow(@PathVariable Long projectId) {
        githubWorkflowService.createWorkflowForProject(projectId);
        return ResponseEntity.ok().build();
    }

    @PutMapping("/projects/{projectId}/workflow")
    public ResponseEntity<Void> updateWorkflow(@PathVariable Long projectId) {
        githubWorkflowService.updateWorkflowForProject(projectId);
        return ResponseEntity.ok().build();
    }
} 