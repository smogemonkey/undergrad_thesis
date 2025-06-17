package com.vulnview.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GitHubExceptionHandler {

    @ExceptionHandler(GitHubException.class)
    public ResponseEntity<Map<String, Object>> handleGitHubException(GitHubException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.BAD_REQUEST.value());
        body.put("error", "GitHub API Error");
        body.put("message", ex.getMessage());
        body.put("path", "/api/github");

        return new ResponseEntity<>(body, HttpStatus.BAD_REQUEST);
    }

    @ExceptionHandler(RepositoryAccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleRepositoryAccessDeniedException(RepositoryAccessDeniedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("error", "Repository Access Denied");
        body.put("message", ex.getMessage());
        body.put("path", "/api/github");

        return new ResponseEntity<>(body, HttpStatus.FORBIDDEN);
    }

    @ExceptionHandler(RepositoryAlreadyConnectedException.class)
    public ResponseEntity<Map<String, Object>> handleRepositoryAlreadyConnectedException(RepositoryAlreadyConnectedException ex) {
        Map<String, Object> body = new HashMap<>();
        body.put("timestamp", LocalDateTime.now());
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("error", "Repository Already Connected");
        body.put("message", ex.getMessage());
        body.put("path", "/api/github");

        return new ResponseEntity<>(body, HttpStatus.CONFLICT);
    }
} 