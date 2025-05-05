package com.vulnview.controller;

import com.vulnview.dto.analysis.AnalysisCreateRequest;
import com.vulnview.dto.analysis.AnalysisResponse;
import com.vulnview.dto.analysis.ReportResponse;
import com.vulnview.service.AnalysisService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/analyses")
@RequiredArgsConstructor
public class AnalysisController {

    private final AnalysisService analysisService;

    @PostMapping
    public ResponseEntity<AnalysisResponse> createAnalysis(@Valid @RequestBody AnalysisCreateRequest request) {
        return new ResponseEntity<>(analysisService.createAnalysis(request), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnalysisResponse> getAnalysis(@PathVariable Long id) {
        return ResponseEntity.ok(analysisService.getAnalysis(id));
    }

    @GetMapping
    public ResponseEntity<List<AnalysisResponse>> getAllAnalyses() {
        return ResponseEntity.ok(analysisService.getAllAnalyses());
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<AnalysisResponse>> getAnalysesByProject(@PathVariable Long projectId) {
        return ResponseEntity.ok(analysisService.getAnalysesByProject(projectId));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAnalysis(@PathVariable Long id) {
        analysisService.deleteAnalysis(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/report")
    public ResponseEntity<ReportResponse> generateReport(@PathVariable Long id) {
        return ResponseEntity.ok(analysisService.generateReport(id));
    }
} 