package com.vulnview.controller;

import com.vulnview.service.ExportService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

@RestController
@RequestMapping("/api/v1/export")
@RequiredArgsConstructor
public class ExportController {
    private final ExportService exportService;

    @GetMapping("/build/{buildId}/sbom")
    public ResponseEntity<byte[]> exportSbom(@PathVariable Long buildId) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        exportService.exportSbomAsCycloneDx(buildId, outputStream);
        
        String filename = String.format("sbom_%s_%s.json", 
            buildId, 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")));
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
            .contentType(MediaType.APPLICATION_JSON)
            .body(outputStream.toByteArray());
    }

    @GetMapping("/build/{buildId}/vulnerabilities")
    public ResponseEntity<byte[]> exportVulnerabilities(@PathVariable Long buildId) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        exportService.exportVulnerabilitiesAsCsv(buildId, outputStream);
        
        String filename = String.format("vulnerabilities_%s_%s.csv", 
            buildId, 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")));
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
            .contentType(MediaType.TEXT_PLAIN)
            .body(outputStream.toByteArray());
    }

    @GetMapping("/build/{buildId}/components")
    public ResponseEntity<byte[]> exportComponents(@PathVariable Long buildId) {
        ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
        exportService.exportComponentsAsCsv(buildId, outputStream);
        
        String filename = String.format("components_%s_%s.csv", 
            buildId, 
            LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss")));
        
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
            .contentType(MediaType.TEXT_PLAIN)
            .body(outputStream.toByteArray());
    }
} 