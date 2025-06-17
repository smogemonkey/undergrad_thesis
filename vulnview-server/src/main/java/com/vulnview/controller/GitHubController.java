package com.vulnview.controller;

import com.vulnview.service.GitHubIntegrationService;
import com.vulnview.entity.Repository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.HttpStatus;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/github")
@RequiredArgsConstructor
public class GitHubController {

    private final GitHubIntegrationService githubService;

    @Value("${github.client.id}")
    private String clientId;

    @Value("${github.redirect.uri}")
    private String redirectUri;

    @PostMapping("/connect")
    public ResponseEntity<Map<String, String>> connectGitHub(Authentication authentication) {
        String authUrl = String.format(
            "https://github.com/login/oauth/authorize?client_id=%s&redirect_uri=%s&scope=repo,read:user",
            clientId,
            redirectUri
        );
        return ResponseEntity.ok(Map.of("url", authUrl));
    }

    @PostMapping("/callback")
    public ResponseEntity<?> handleCallback(@RequestBody Map<String, String> body, Authentication authentication) {
        try {
            if (authentication == null || !authentication.isAuthenticated()) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "User not authenticated"));
            }

            String code = body.get("code");
            if (code == null) {
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "No authorization code provided"));
            }

            Map<String, String> result = githubService.connectGitHubAccount(code, authentication.getName());
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/repositories")
    public ResponseEntity<?> listRepositories(Authentication authentication) {
        try {
            return ResponseEntity.ok(githubService.listUserRepositories(authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/repositories/{owner}/{repo}/connect")
    public ResponseEntity<?> connectRepository(
            @PathVariable String owner,
            @PathVariable String repo,
            @RequestBody Map<String, Long> body,
            Authentication authentication) {
        try {
            Long projectId = body.get("projectId");
            if (projectId == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Project ID is required"));
            }
            return ResponseEntity.ok(githubService.connectRepository(owner, repo, projectId, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/repositories/{repositoryId}/sync")
    public ResponseEntity<?> syncRepository(
            @PathVariable Long repositoryId,
            Authentication authentication) {
        try {
            return ResponseEntity.ok(githubService.syncRepository(repositoryId, authentication.getName()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/repositories/{repositoryId}/sbom")
    public ResponseEntity<?> getRepositorySbom(
            @PathVariable Long repositoryId,
            Authentication authentication) {
        try {
            Repository repository = githubService.getRepositoryById(repositoryId);
            if (repository.getSbomJson() == null) {
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(Map.of("sbom", repository.getSbomJson()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
} 