package com.vulnview.service;

import com.vulnview.entity.Repository;
import java.util.List;
import java.util.Map;

public interface GitHubIntegrationService {
    /**
     * Get repository details from GitHub
     */
    Map<String, Object> getRepositoryDetails(String owner, String repo, String token);

    /**
     * Connect a GitHub repository to a project
     */
    Repository connectRepository(String owner, String repo, Long projectId, String username);

    /**
     * Sync repository data from GitHub
     */
    Map<String, Object> syncRepository(Long repositoryId, String username);

    /**
     * Get repository branches from GitHub
     */
    List<Map<String, Object>> getRepositoryBranches(String owner, String repo, String username);

    /**
     * Get repository commits from GitHub
     */
    List<Map<String, Object>> getRepositoryCommits(String owner, String repo, String branch, String username);

    /**
     * Verify if user has access to the GitHub repository
     */
    boolean verifyRepositoryAccess(String owner, String repo, String token);

    /**
     * Exchange GitHub OAuth code for access token
     */
    String exchangeCodeForToken(String code);

    /**
     * Get GitHub user info using access token
     */
    Map<String, Object> getUserInfo(String token);

    Map<String, String> connectGitHubAccount(String code, String username);
    List<Map<String, Object>> listUserRepositories(String username);

    /**
     * Get repository SBOM from GitHub
     */
    Map<String, Object> getRepositorySbom(Long repositoryId, String username);

    Repository getRepositoryById(Long repositoryId);

    /**
     * Get a specific commit from GitHub by SHA
     */
    Map<String, Object> getRepositoryCommit(String owner, String repo, String sha, String token);
} 