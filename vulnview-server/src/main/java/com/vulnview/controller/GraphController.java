package com.vulnview.controller;

import com.vulnview.dto.graph.GraphDataResponse;
import com.vulnview.service.GraphDataService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/graph")
@RequiredArgsConstructor
public class GraphController {

    private final GraphDataService graphDataService;

    @GetMapping("/build/{buildId}")
    public ResponseEntity<GraphDataResponse> getGraphDataForBuild(@PathVariable String buildId) {
        GraphDataResponse response = graphDataService.getGraphDataForBuild(buildId);
        return ResponseEntity.ok(response);
    }
} 
 
 