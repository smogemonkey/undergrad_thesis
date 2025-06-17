package com.vulnview.controller;

import com.vulnview.dto.BuildDTO;
import com.vulnview.dto.build.CompareBuildResponse;
import com.vulnview.dto.build.ComponentResponse;
import com.vulnview.dto.build.DetailComponentResponse;
import com.vulnview.dto.build.DependencyResponse;
import com.vulnview.service.BuildService;
import com.vulnview.service.AuthenticationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/builds")
public class BuildController extends BaseController {

    private final BuildService buildService;
    private final AuthenticationService authenticationService;

    public BuildController(BuildService buildService, AuthenticationService authenticationService) {
        super(authenticationService);
        this.buildService = buildService;
        this.authenticationService = authenticationService;
    }

    @PostMapping
    public ResponseEntity<BuildDTO> createBuild(@RequestBody BuildDTO buildDTO) {
        return ResponseEntity.ok(buildService.createBuild(buildDTO));
    }

    @GetMapping("/{id}")
    public ResponseEntity<BuildDTO> getBuild(@PathVariable Long id) {
        return ResponseEntity.ok(buildService.getBuild(id));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<Page<BuildDTO>> getBuildsByProject(
            @PathVariable Long projectId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(buildService.getBuildsByProject(projectId, page, size));
    }

    @GetMapping("/pipeline/{pipelineId}")
    public ResponseEntity<Page<BuildDTO>> getBuildsByPipeline(
            @PathVariable Long pipelineId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(buildService.getBuildsByPipeline(pipelineId, page, size));
    }

    @GetMapping("/{id}/components")
    public ResponseEntity<Page<ComponentResponse>> getBuildComponents(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(buildService.getBuildComponents(id, page, size));
    }

    @GetMapping("/{id}/dependencies")
    public ResponseEntity<Page<DependencyResponse>> getBuildDependencies(
            @PathVariable Long id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ResponseEntity.ok(buildService.getBuildDependencies(id, page, size));
    }

    @GetMapping("/compare")
    public ResponseEntity<CompareBuildResponse> compareBuilds(
            @RequestParam Long buildId1,
            @RequestParam Long buildId2) {
        return ResponseEntity.ok(buildService.compareBuilds(buildId1, buildId2));
    }
} 