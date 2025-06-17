package com.vulnview.controller;

import com.vulnview.dto.ai.AiRemediationRequestDto;
import com.vulnview.dto.ai.AiRemediationResponseDto;
import com.vulnview.service.AiService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.vulnview.repository.ComponentVulnerabilityRepository;
import com.vulnview.entity.ComponentVulnerability;
import com.vulnview.entity.Component;
import com.vulnview.entity.Sbom;
import com.vulnview.repository.SbomRepository;
import org.springframework.beans.factory.annotation.Autowired;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
@RequiredArgsConstructor
public class AiRemediationController {

    private final AiService aiService;
    @Autowired
    private ComponentVulnerabilityRepository componentVulnerabilityRepository;
    @Autowired
    private SbomRepository sbomRepository;

    @GetMapping("/sbom/{sbomId}/vulnerable-components")
    public ResponseEntity<List<Map<String, Object>>> getVulnerableComponentsForSbom(@PathVariable Long sbomId) {
        Sbom sbom = sbomRepository.findById(sbomId).orElse(null);
        if (sbom == null) {
            return ResponseEntity.ok(List.of());
        }
        List<ComponentVulnerability> cvs = componentVulnerabilityRepository.findBySbomId(sbomId);
        Map<Long, Map<String, Object>> componentMap = new java.util.HashMap<>();
        for (ComponentVulnerability cv : cvs) {
            Component comp = cv.getComponent();
            if (!componentMap.containsKey(comp.getId())) {
                Map<String, Object> compData = new java.util.HashMap<>();
                compData.put("id", comp.getId());
                compData.put("name", comp.getName());
                compData.put("version", comp.getVersion());
                compData.put("type", comp.getType());
                compData.put("packageUrl", comp.getPackageUrl());
                compData.put("riskLevel", comp.getRiskLevel() != null ? comp.getRiskLevel().name() : null);
                compData.put("vulnerabilities", new java.util.ArrayList<>());
                componentMap.put(comp.getId(), compData);
            }
            Map<String, Object> vulnData = new java.util.HashMap<>();
            vulnData.put("cveId", cv.getVulnerability().getCveId());
            vulnData.put("description", cv.getVulnerability().getDescription());
            vulnData.put("severity", cv.getVulnerability().getSeverity());
            vulnData.put("cvssScore", cv.getVulnerability().getCvssScore());
            ((List<Object>)componentMap.get(comp.getId()).get("vulnerabilities")).add(vulnData);
        }
        return ResponseEntity.ok(new java.util.ArrayList<>(componentMap.values()));
    }

    @PostMapping("/remediation")
    public ResponseEntity<AiRemediationResponseDto> getRemediationSuggestion(
            @RequestBody AiRemediationRequestDto requestDto) {
        return ResponseEntity.ok(aiService.getRemediationSuggestion(requestDto));
    }

    @GetMapping("/sbom/{sbomId}/analysis")
    public ResponseEntity<Map<String, Object>> analyzeSbom(@PathVariable Long sbomId) {
        return ResponseEntity.ok(aiService.analyzeSbom(sbomId));
    }
} 