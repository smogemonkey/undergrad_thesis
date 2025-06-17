package com.vulnview.exception;

public class RepositoryAlreadyConnectedException extends GitHubException {
    public RepositoryAlreadyConnectedException(String owner, String repo) {
        super(String.format("Repository %s/%s is already connected to this project", owner, repo));
    }
} 