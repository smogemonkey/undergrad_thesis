package com.vulnview.controller;

import com.vulnview.service.SnykScanService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/v1/scan")
@Slf4j
public class SnykScanController {
    private final SnykScanService snykScanService;

    @Autowired
    public SnykScanController(SnykScanService snykScanService) {
        this.snykScanService = snykScanService;
    }

    @GetMapping("/repositories/{repositoryId}/raw-results")
    public ResponseEntity<?> getRawSnykResults(@PathVariable Long repositoryId) {
        try {
            Map<String, Object> rawResults = snykScanService.getRawSnykResults(repositoryId);
            return ResponseEntity.ok(rawResults);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Failed to get raw Snyk results",
                    "message", e.getMessage()
                ));
        }
    }
} 