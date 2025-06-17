package com.vulnview.controller;

import com.vulnview.dto.ai.AiRemediationRequestDto;
import com.vulnview.dto.ai.AiRemediationResponseDto;
import com.vulnview.dto.ai.AiAlternativeRequestDto;
import com.vulnview.dto.ai.AiAlternativeResponseDto;
import com.vulnview.service.AiService;
import com.vulnview.entity.Sbom;
import com.vulnview.entity.Component;
import com.vulnview.entity.ComponentVulnerability;
import com.vulnview.entity.Vulnerability;
import com.vulnview.repository.SbomRepository;
import com.vulnview.repository.ComponentVulnerabilityRepository;
import com.vulnview.repository.ComponentRepository;
import com.vulnview.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.security.access.prepost.PreAuthorize;
import com.vulnview.dto.ai.AiRequestDto;
import com.vulnview.entity.AiSolution;
import com.vulnview.repository.AiSolutionRepository;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/api/v1/ai")
@RequiredArgsConstructor
public class AiController {

    private final AiService aiService;
    private final ObjectMapper objectMapper;
    private final SbomRepository sbomRepository;
    private final ComponentVulnerabilityRepository componentVulnerabilityRepository;
    private final AiSolutionRepository aiSolutionRepository;
    private final ComponentRepository componentRepository;

    @PostMapping("/remediation/{vulnerabilityId}")
    public ResponseEntity<?> getRemediation(
        @PathVariable String vulnerabilityId,
        @RequestBody(required = false) Map<String, Object> requestBody
    ) {
        try {
            log.info("Getting AI remediation for vulnerability: {}", vulnerabilityId);
            
            // Create request DTO from the request body
            AiRequestDto requestDto = new AiRequestDto();
            requestDto.setVulnerabilityId(vulnerabilityId);
            
            if (requestBody != null) {
                if (requestBody.get("componentPurl") != null) {
                    // Find component by PURL
                    Component component = componentRepository.findByPackageUrl((String) requestBody.get("componentPurl"))
                        .orElseThrow(() -> new ResourceNotFoundException("Component not found"));
                    requestDto.setComponentId(component.getId());
                }
                
                if (requestBody.get("projectContextDescription") != null) {
                    requestDto.setProjectContextDescription((String) requestBody.get("projectContextDescription"));
                }
            }
            
            String remediation = aiService.getRemediation(requestDto.getComponentId(), requestDto.getVulnerabilityId());
            
            // Parse the remediation response
            String[] parts = remediation.split("Remediation:|Suggestion:");
            String context = parts[0].trim();
            String remediationSteps = parts.length > 1 ? parts[1].trim() : "";
            String suggestion = parts.length > 2 ? parts[2].trim() : "";

            // Save the solution
            Component component = componentRepository.findById(requestDto.getComponentId())
                .orElseThrow(() -> new ResourceNotFoundException("Component not found"));
            
            AiSolution solution = AiSolution.builder()
                .vulnerabilityId(vulnerabilityId)
                .componentName(component.getName())
                .componentVersion(component.getVersion())
                .context(context)
                .remediation(remediationSteps)
                .suggestion(suggestion)
                .severity(component.getRiskLevel().name())
                .build();
            
            aiSolutionRepository.save(solution);
            
            // Format response to match frontend expectations
            Map<String, Object> response = new HashMap<>();
            response.put("suggestedRemediations", Arrays.asList(
                Map.of(
                    "type", "REMEDIATION",
                    "description", remediation,
                    "confidence", "HIGH"
                )
            ));
            response.put("overallRiskAssessment", "This remediation was generated based on the vulnerability and component context.");
            response.put("disclaimer", "This is an AI-generated suggestion. Please review carefully before implementing.");
            
            return ResponseEntity.ok(response);
        } catch (ResourceNotFoundException e) {
            log.error("Resource not found: {}", e.getMessage());
            return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            log.error("Error getting remediation: {}", e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Failed to get AI remediation: " + e.getMessage()));
        }
    }

    @PostMapping("/components/suggest-alternatives")
    public ResponseEntity<AiAlternativeResponseDto> suggestAlternativePackages(
            @RequestBody AiAlternativeRequestDto requestDto) {
        return ResponseEntity.ok(aiService.suggestAlternativePackages(requestDto));
    }

    @PostMapping("/sbom/analyze")
    public ResponseEntity<Map<String, List<AiRemediationResponseDto>>> analyzeSbom(@RequestBody String sbomJson) {
        try {
            JsonNode root = objectMapper.readTree(sbomJson);
            Map<String, List<AiRemediationResponseDto>> results = new HashMap<>();
            
            // Process each vulnerability in the SBOM
            JsonNode vulnerabilities = root.get("vulnerabilities");
            if (vulnerabilities != null && vulnerabilities.isArray()) {
                for (JsonNode vuln : vulnerabilities) {
                    String vulnId = vuln.get("id").asText();
                    List<AiRemediationResponseDto> remediations = new ArrayList<>();
                    
                    // Process each affected component
                    JsonNode affected = vuln.get("affected");
                    if (affected != null && affected.isArray()) {
                        for (JsonNode aff : affected) {
                            String componentRef = aff.get("ref").asText();
                            
                            // Create remediation request
                            AiRemediationRequestDto requestDto = AiRemediationRequestDto.builder()
                                .vulnerabilityDbId(vulnId)
                                .affectedComponentPurl(componentRef)
                                .affectedComponentVersion(componentRef.split("@")[1])
                                .projectContextDescription("Analysis of SBOM vulnerabilities")
                                .build();
                            
                            // Get AI remediation suggestions
                            AiRemediationResponseDto remediation = aiService.getRemediationSuggestion(requestDto);
                            remediations.add(remediation);
                        }
                    }
                    
                    results.put(vulnId, remediations);
                }
            }
            
            return ResponseEntity.ok(results);
        } catch (Exception e) {
            log.error("Error processing SBOM: {}", e.getMessage());
            throw new RuntimeException("Failed to process SBOM", e);
        }
    }

    @PostMapping("/enrich/component/{componentId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> triggerEnrichmentForComponent(@PathVariable Long componentId) {
        aiService.triggerEnrichmentForComponent(componentId);
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/enrich/build/{buildId}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> triggerEnrichmentForBuild(@PathVariable Long buildId) {
        aiService.triggerEnrichmentForBuild(buildId);
        return ResponseEntity.accepted().build();
    }

    @GetMapping("/analyze/sbom/{sbomId}")
    public ResponseEntity<?> analyzeSbom(@PathVariable Long sbomId) {
        try {
            Sbom sbom = sbomRepository.findById(sbomId)
                .orElseThrow(() -> new RuntimeException("SBOM not found"));

            // Get all components from the SBOM
            Set<Component> components = sbom.getComponents();
            if (components.isEmpty()) {
                return ResponseEntity.ok(Map.of(
                    "message", "No components found in SBOM",
                    "riskLevel", "LOW",
                    "severityCounts", Map.of(
                        "CRITICAL", 0,
                        "HIGH", 0,
                        "MEDIUM", 0,
                        "LOW", 0
                    ),
                    "totalComponents", 0,
                    "totalCvssScore", 0.0,
                    "averageCvssScore", 0.0
                ));
            }

            // Get all component vulnerabilities
            List<Long> componentIds = components.stream()
                .map(Component::getId)
                .collect(Collectors.toList());
            List<ComponentVulnerability> componentVulnerabilities = componentVulnerabilityRepository.findByComponentIdIn(componentIds);

            // Process vulnerabilities
            Map<String, Integer> severityCounts = new HashMap<>();
            double totalCvssScore = 0.0;
            int totalVulnerabilities = 0;

            for (ComponentVulnerability cv : componentVulnerabilities) {
                Vulnerability vuln = cv.getVulnerability();
                String severity = vuln.getSeverity();
                severityCounts.merge(severity, 1, Integer::sum);
                totalCvssScore += vuln.getCvssScore();
                totalVulnerabilities++;
            }

            // Calculate average CVSS score
            double averageCvssScore = totalVulnerabilities > 0 ? totalCvssScore / totalVulnerabilities : 0.0;

            // Determine overall risk level
            String overallRiskLevel = calculateOverallRiskLevel(severityCounts);

            // Build the response
            Map<String, Object> response = new HashMap<>();
            response.put("riskLevel", overallRiskLevel);
            response.put("severityCounts", severityCounts);
            response.put("totalComponents", components.size());
            response.put("totalCvssScore", totalCvssScore);
            response.put("averageCvssScore", averageCvssScore);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", e.getMessage()));
        }
    }

    private String calculateOverallRiskLevel(Map<String, Integer> severityCounts) {
        if (severityCounts.getOrDefault("CRITICAL", 0) > 0) {
            return "CRITICAL";
        } else if (severityCounts.getOrDefault("HIGH", 0) > 0) {
            return "HIGH";
        } else if (severityCounts.getOrDefault("MEDIUM", 0) > 0) {
            return "MEDIUM";
        } else {
            return "LOW";
        }
    }

    @PostMapping("/recommendation")
    public ResponseEntity<Map<String, String>> getRecommendation(@RequestBody AiRequestDto request) {
        String recommendation = aiService.getRecommendation(
            request.getComponentId(),
            Long.parseLong(request.getVulnerabilityId())
        );
        return ResponseEntity.ok(Map.of("content", recommendation));
    }

    @PostMapping("/remediation")
    public ResponseEntity<Map<String, String>> getRemediation(@RequestBody AiRequestDto request) {
        String remediation = aiService.getRemediation(request.getComponentId(), request.getVulnerabilityId());
        return ResponseEntity.ok(Map.of("content", remediation));
    }

    @PostMapping("/fix")
    public ResponseEntity<Map<String, String>> getFix(@RequestBody AiRequestDto request) {
        String fix = aiService.getFix(
            request.getComponentId(),
            Long.parseLong(request.getVulnerabilityId())
        );
        return ResponseEntity.ok(Map.of("content", fix));
    }
    
    // Endpoint to get all saved solutions for a project
    @GetMapping("/solutions/project/{projectId}")
    public ResponseEntity<?> getProjectSolutions(@PathVariable Long projectId) {
        return ResponseEntity.ok(aiService.getProjectSolutions(projectId));
    }

    @GetMapping("/solutions")
    public ResponseEntity<List<Map<String, Object>>> getSolutions() {
        try {
            List<AiSolution> solutions = aiSolutionRepository.findAllByOrderByCreatedAtDesc();
            List<Map<String, Object>> response = solutions.stream()
                .map(solution -> {
                    Map<String, Object> solutionMap = new HashMap<>();
                    solutionMap.put("id", solution.getId().toString());
                    solutionMap.put("vulnerabilityId", solution.getVulnerabilityId());
                    solutionMap.put("componentName", solution.getComponentName());
                    solutionMap.put("componentVersion", solution.getComponentVersion());
                    solutionMap.put("context", solution.getContext());
                    solutionMap.put("remediation", solution.getRemediation());
                    solutionMap.put("suggestion", solution.getSuggestion());
                    solutionMap.put("severity", solution.getSeverity());
                    solutionMap.put("timestamp", solution.getCreatedAt().toString());
                    return solutionMap;
                })
                .collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error fetching solutions: {}", e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(List.of());
        }
    }
} 