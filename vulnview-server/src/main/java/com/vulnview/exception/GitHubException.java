package com.vulnview.exception;

public class GitHubException extends RuntimeException {
    public GitHubException(String message) {
        super(message);
    }

    public GitHubException(String message, Throwable cause) {
        super(message, cause);
    }
} 