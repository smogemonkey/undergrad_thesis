package com.vulnview.controller;

import com.vulnview.dto.PipelineDTO;
import com.vulnview.service.PipelineService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/pipelines")
@RequiredArgsConstructor
public class PipelineController {

    private final PipelineService pipelineService;

    @PostMapping
    public ResponseEntity<PipelineDTO> createPipeline(@Valid @RequestBody PipelineDTO pipelineDTO) {
        return new ResponseEntity<>(pipelineService.createPipeline(pipelineDTO), HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    public ResponseEntity<PipelineDTO> getPipeline(@PathVariable Long id) {
        return ResponseEntity.ok(pipelineService.getPipeline(id));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<Page<PipelineDTO>> getPipelinesByProject(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(pipelineService.getPipelinesByProject(projectId, page, size));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PipelineDTO> updatePipeline(
            @PathVariable Long id,
            @Valid @RequestBody PipelineDTO pipelineDTO) {
        return ResponseEntity.ok(pipelineService.updatePipeline(id, pipelineDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePipeline(@PathVariable Long id) {
        pipelineService.deletePipeline(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<PipelineDTO> updatePipelineStatus(
            @PathVariable Long id,
            @RequestParam String status) {
        return ResponseEntity.ok(pipelineService.updatePipelineStatus(id, status));
    }
} 