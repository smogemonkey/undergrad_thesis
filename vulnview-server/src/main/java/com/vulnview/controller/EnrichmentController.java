package com.vulnview.controller;

import com.vulnview.service.VulnerabilityEnrichmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/enrichment")
@RequiredArgsConstructor
public class EnrichmentController {

    private final VulnerabilityEnrichmentService enrichmentService;

    @PostMapping("/build/{buildId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> triggerEnrichmentForBuild(@PathVariable Long buildId) {
        enrichmentService.enrichVulnerabilitiesForSbomAsync(buildId);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/component/{componentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> triggerEnrichmentForComponent(@PathVariable Long componentId) {
        enrichmentService.enrichVulnerabilitiesForComponentAsync(componentId);
        return ResponseEntity.accepted().build();
    }
} 