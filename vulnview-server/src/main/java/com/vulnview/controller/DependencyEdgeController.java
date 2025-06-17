package com.vulnview.controller;

import com.vulnview.entity.DependencyEdge;
import com.vulnview.service.DependencyEdgeService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dependencies")
@RequiredArgsConstructor
public class DependencyEdgeController {
    private final DependencyEdgeService dependencyEdgeService;

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<DependencyEdge>> getDependencyEdges(@PathVariable Long projectId) {
        return ResponseEntity.ok(dependencyEdgeService.getDependencyEdgesByProject(projectId));
    }

    @GetMapping("/graph/{projectId}")
    public ResponseEntity<Map<String, Object>> getDependencyGraph(@PathVariable Long projectId) {
        return ResponseEntity.ok(dependencyEdgeService.getDependencyGraphData(projectId));
    }

    @PostMapping("/project/{projectId}")
    public ResponseEntity<Void> saveDependencyEdges(
            @PathVariable Long projectId,
            @RequestBody List<DependencyEdge> edges) {
        dependencyEdgeService.saveDependencyEdges(projectId, edges);
        return ResponseEntity.ok().build();
    }
} 