package com.vulnview.model;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class ScanProgress {
    private String status;
    private int totalComponents;
    private int processedComponents;
    private String errorMessage;
    private LocalDateTime lastUpdated;

    public ScanProgress() {
        this.lastUpdated = LocalDateTime.now();
    }

    public void incrementProcessedComponents() {
        this.processedComponents++;
        this.lastUpdated = LocalDateTime.now();
    }

    public void setStatus(String status) {
        this.status = status;
        this.lastUpdated = LocalDateTime.now();
    }

    public void setErrorMessage(String errorMessage) {
        this.errorMessage = errorMessage;
        this.lastUpdated = LocalDateTime.now();
    }
} 