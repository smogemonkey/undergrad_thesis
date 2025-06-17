package com.vulnview.controller;

import com.vulnview.service.AuthenticationService;
import lombok.Getter;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;

public abstract class BaseController {
    
    @Getter
    protected final AuthenticationService authenticationService;

    protected BaseController(AuthenticationService authenticationService) {
        this.authenticationService = authenticationService;
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<String> handleRuntimeException(RuntimeException ex) {
        return ResponseEntity.badRequest().body(ex.getMessage());
    }

    protected Long getCurrentUserId() {
        return authenticationService.getCurrentUserId();
    }

    protected boolean isAdmin() {
        return authenticationService.isAdmin();
    }

    protected boolean isProjectAdmin(Long projectId) {
        return authenticationService.isProjectAdmin(projectId);
    }

    protected boolean isProjectMember(Long projectId) {
        return authenticationService.isProjectMember(projectId);
    }
} 