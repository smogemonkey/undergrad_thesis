package com.vulnview.controller;

import com.vulnview.dto.ComponentDto;
import com.vulnview.dto.component.ComponentResponseDto;
import com.vulnview.dto.vulnerability.VulnerabilityResponse;
import com.vulnview.entity.Component;
import com.vulnview.mapper.ComponentMapper;
import com.vulnview.service.ComponentService;
import com.vulnview.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@Tag(name = "Components", description = "Component management APIs")
@SecurityRequirement(name = "bearerAuth")
public class ComponentController extends BaseController {
    private final ComponentService componentService;
    private final ComponentMapper componentMapper;

    public ComponentController(ComponentService componentService, 
                             AuthenticationService authenticationService,
                             ComponentMapper componentMapper) {
        super(authenticationService);
        this.componentService = componentService;
        this.componentMapper = componentMapper;
    }

    @GetMapping("/components")
    @Operation(summary = "Get all components")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<ComponentDto>> getAllComponents() {
        log.info("GET /api/v1/components called");
        Page<Component> components = componentService.getAllComponents(Pageable.unpaged());
        List<ComponentDto> response = components.getContent().stream()
            .map(componentMapper::toDto)
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/components/{id}")
    @Operation(summary = "Get component by ID")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<ComponentDto> getComponentById(@PathVariable Long id) {
        Component component = componentService.getComponentById(id);
        return ResponseEntity.ok(componentMapper.toDto(component));
    }

    @GetMapping("/projects/{projectId}/components")
    @Operation(summary = "Get components by project ID")
    @PreAuthorize("hasAnyRole('USER', 'ADMIN')")
    public ResponseEntity<List<ComponentDto>> getComponentsByProject(@PathVariable Long projectId) {
        Page<Component> components = componentService.getComponentsByProject(projectId, Pageable.unpaged());
        List<ComponentDto> response = components.getContent().stream()
            .map(componentMapper::toDto)
            .collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    private ComponentResponseDto mapToResponse(Component component) {
        return ComponentResponseDto.builder()
            .id(component.getId())
            .name(component.getName())
            .version(component.getVersion())
            .type(component.getType())
            .packageUrl(component.getPurl())
            .riskLevel(component.getRiskLevel())
            .vulnerabilityIds(component.getComponentVulnerabilities().stream()
                .map(cv -> cv.getVulnerability().getId())
                .collect(Collectors.toSet()))
            .build();
    }
} 