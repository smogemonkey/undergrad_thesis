package com.vulnview.exception;

public class RepositoryAccessDeniedException extends GitHubException {
    public RepositoryAccessDeniedException(String owner, String repo) {
        super(String.format("Access denied to repository %s/%s", owner, repo));
    }
} 