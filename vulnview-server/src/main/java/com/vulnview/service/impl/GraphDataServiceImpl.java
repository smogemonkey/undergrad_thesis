package com.vulnview.service.impl;

import com.vulnview.dto.graph.GraphDataResponse;
import com.vulnview.dto.graph.GraphNode;
import com.vulnview.dto.graph.GraphLink;
import com.vulnview.service.GraphDataService;
import com.vulnview.service.BuildService;
import com.vulnview.service.ComponentService;
import com.vulnview.service.SbomService;
import com.vulnview.service.VulnerabilityScanService;
import com.vulnview.entity.Build;
import com.vulnview.entity.Sbom;
import com.vulnview.entity.Component;
import com.vulnview.entity.DependencyEdge;
import com.vulnview.entity.Vulnerability;
import com.vulnview.entity.ComponentVulnerability;
import com.vulnview.entity.RiskLevel;
import com.vulnview.exception.ResourceNotFoundException;
import com.vulnview.repository.SbomRepository;
import com.vulnview.repository.DependencyEdgeRepository;
import com.vulnview.repository.ComponentVulnerabilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.ArrayList;
import java.util.stream.Collectors;
import java.util.Map;
import java.util.Set;
import java.util.HashMap;
import java.util.HashSet;

@Slf4j
@Service
@RequiredArgsConstructor
public class GraphDataServiceImpl implements GraphDataService {

    private final BuildService buildService;
    private final ComponentService componentService;
    private final SbomService sbomService;
    private final VulnerabilityScanService vulnerabilityScanService;
    private final SbomRepository sbomRepository;
    private final DependencyEdgeRepository dependencyEdgeRepository;
    private final ComponentVulnerabilityRepository componentVulnerabilityRepository;

    @Override
    @Transactional(readOnly = true)
    public GraphDataResponse getGraphDataForBuild(String buildId) {
        // Get build and verify it exists
        Build build = buildService.getBuildById(buildId)
            .orElseThrow(() -> new ResourceNotFoundException("Build not found: " + buildId));

        // Get SBOM for the build
        Sbom sbom = sbomService.getSbomByBuildId(buildId)
            .orElseThrow(() -> new ResourceNotFoundException("SBOM not found for build: " + buildId));

        // Get scan status
        String scanStatus = vulnerabilityScanService.getStatusForBuild(buildId);
        System.out.println("Current scan status for build " + buildId + ": " + scanStatus);

        // Get all components for this SBOM
        List<Component> components = sbomService.getComponentsBySbomId(sbom.getId());
        System.out.println("Found " + components.size() + " components for SBOM " + sbom.getId());

        // Transform components to graph nodes
        List<GraphNode> nodes = components.stream()
            .map(this::convertToGraphNode)
            .collect(Collectors.toList());

        // Get all dependencies for this SBOM
        List<DependencyEdge> dependencies = sbomService.getDependenciesBySbomId(sbom.getId());
        System.out.println("Found " + dependencies.size() + " dependencies for SBOM " + sbom.getId());

        // Transform dependencies to graph links
        List<GraphLink> links = dependencies.stream()
            .map(this::convertToGraphLink)
            .collect(Collectors.toList());

        GraphDataResponse response = GraphDataResponse.builder()
            .nodes(nodes)
            .links(links)
            .scanStatus(scanStatus)
            .build();

        System.out.println("Returning graph data with " + nodes.size() + " nodes and " + links.size() + " links");
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public GraphDataResponse getGraphDataForSbom(Long sbomId) {
        log.info("=== Starting Graph Data Generation for SBOM ID: {} ===", sbomId);
        
        try {
            // Get SBOM and verify it exists
            Sbom sbom = sbomRepository.findById(sbomId)
                .orElseThrow(() -> {
                    log.error("SBOM not found with ID: {}", sbomId);
                    return new ResourceNotFoundException("SBOM not found");
                });
            log.info("Found SBOM: id={}, format={}, version={}", sbom.getId(), sbom.getBomFormat(), sbom.getSpecVersion());

            // Get all components for this SBOM
            List<Component> components = sbomService.getComponentsBySbomId(sbom.getId());
            log.info("Retrieved {} components for SBOM {}", components.size(), sbom.getId());

            // Log component details
            components.forEach(component -> {
                log.info("Component details:");
                log.info("  - Name: {}", component.getName());
                log.info("  - Version: {}", component.getVersion());
                log.info("  - Type: {}", component.getType());
                log.info("  - Package URL: {}", component.getPackageUrl());
                log.info("  - Risk Level: {}", component.getRiskLevel());
                
                // Log vulnerabilities from repository
                List<ComponentVulnerability> vulns = componentVulnerabilityRepository.findByComponentId(component.getId());
                log.info("  - Vulnerabilities from DB: {}", vulns.size());
                vulns.forEach(cv -> {
                    Vulnerability v = cv.getVulnerability();
                    log.info("    * CVE: {}, Severity: {}, CVSS: {}", 
                        v.getCveId(), v.getSeverity(), v.getCvssScore());
                });
            });

            // Transform components to graph nodes
            List<GraphNode> nodes = components.stream()
                .map(component -> {
                    GraphNode node = convertToGraphNode(component);
                    log.info("Created node: id={}, name={}, vulnerabilities={}, riskLevel={}", 
                        node.getId(), node.getName(), node.getVulnerabilityInfos().size(), node.getRiskLevel());
                    return node;
                })
                .collect(Collectors.toList());

            // Get all dependencies for this SBOM
            List<DependencyEdge> dependencies = sbomService.getDependenciesBySbomId(sbom.getId());
            log.info("Retrieved {} dependencies for SBOM {}", dependencies.size(), sbom.getId());

            // Transform dependencies to graph links
            List<GraphLink> links = dependencies.stream()
                .map(dep -> {
                    GraphLink link = convertToGraphLink(dep);
                    if (link != null) {
                        log.info("Created link: source={}, target={}", link.getSource(), link.getTarget());
                    }
                    return link;
                })
                .filter(link -> link != null)
                .collect(Collectors.toList());

            GraphDataResponse response = GraphDataResponse.builder()
                .nodes(nodes)
                .links(links)
                .build();

            // Log detailed response information
            log.info("=== Graph Response Details ===");
            log.info("Total nodes: {}", nodes.size());
            log.info("Total links: {}", links.size());
            log.info("Nodes with vulnerabilities: {}", 
                nodes.stream().filter(n -> !n.getVulnerabilityInfos().isEmpty()).count());
            
            // Log risk level distribution
            Map<String, Long> riskDistribution = nodes.stream()
                .collect(Collectors.groupingBy(
                    GraphNode::getRiskLevel,
                    Collectors.counting()
                ));
            log.info("Risk level distribution: {}", riskDistribution);
            
            log.info("=== Graph Data Generation Completed Successfully ===");
            return response;

        } catch (Exception e) {
            log.error("=== Error Generating Graph Data ===");
            log.error("Error details: ", e);
            throw e;
        }
    }

    private GraphNode convertToGraphNode(Component component) {
        log.info("Converting component to graph node: {} (ID: {})", component.getName(), component.getId());
        
        Set<ComponentVulnerability> componentVulns = component.getComponentVulnerabilities();
        log.info("Component {} has {} vulnerabilities", component.getName(), componentVulns.size());
        
        List<GraphNode.VulnerabilityInfo> vulnInfos = new ArrayList<>();
        double maxCvssScore = 0.0;
        
        for (ComponentVulnerability cv : componentVulns) {
            Vulnerability vuln = cv.getVulnerability();
            if (vuln == null) {
                log.warn("Vulnerability is null for ComponentVulnerability of component: {}", component.getName());
                continue;
            }
            
            log.info("Processing vulnerability: {} for component {}", vuln.getCveId(), component.getName());
            log.info("Vulnerability details: severity={}, cvss={}, description={}", 
                vuln.getSeverity(), vuln.getCvssScore(), vuln.getDescription());
            
            GraphNode.VulnerabilityInfo vulnInfo = GraphNode.VulnerabilityInfo.builder()
                .id(vuln.getCveId())
                .severity(vuln.getSeverity())
                .cvss(String.valueOf(vuln.getCvssScore()))
                .description(vuln.getDescription())
                .build();
            vulnInfos.add(vulnInfo);
            
            maxCvssScore = Math.max(maxCvssScore, vuln.getCvssScore());
        }

        String riskLevel = component.getRiskLevel() != null ? 
            component.getRiskLevel().toString().toLowerCase() : 
            calculateRiskLevel(maxCvssScore);
            
        log.info("Final risk level for component {}: {} (based on max CVSS: {})", 
            component.getName(), riskLevel, maxCvssScore);

        int dependencies = component.getOutgoingDependencies().size();
        int dependents = component.getIncomingDependencies().size();
        log.info("Component {} has {} dependencies and {} dependents", 
            component.getName(), dependencies, dependents);

        int baseSize = 24;
        int vulnFactor = vulnInfos.isEmpty() ? 0 : (int)(maxCvssScore * 3);
        int depFactor = Math.min((dependencies + dependents) * 2, 24);
        int size = Math.min(baseSize + vulnFactor + depFactor, 72);

        return GraphNode.builder()
            .id(component.getId().toString())
            .name(component.getName())
            .version(component.getVersion())
            .type(component.getType())
            .riskLevel(riskLevel)
            .purl(component.getPackageUrl())
            .size(size)
            .dependencies(dependencies)
            .dependents(dependents)
            .vulnerabilityInfos(vulnInfos)
            .build();
    }

    private String calculateRiskLevel(double cvssScore) {
        if (cvssScore >= 9.0) return "critical";
        if (cvssScore >= 7.0) return "high";
        if (cvssScore >= 4.0) return "medium";
        if (cvssScore > 0.0) return "low";
        return "safe";
    }

    private GraphLink convertToGraphLink(DependencyEdge edge) {
        log.info("Converting dependency edge to graph link: {} -> {}", 
            edge.getSourceComponent().getName(), 
            edge.getTargetComponent().getName());
        
        return GraphLink.builder()
            .source(edge.getSourceComponent().getId().toString())
            .target(edge.getTargetComponent().getId().toString())
            .value(1)
            .build();
    }

    private List<GraphLink> createLinks(Component component) {
        List<GraphLink> links = new ArrayList<>();

        component.getOutgoingDependencies().forEach(dep -> {
            links.add(GraphLink.builder()
                    .source(component.getId().toString())
                    .target(dep.getId().toString())
                    .value(1)
                    .build());
        });

        component.getIncomingDependencies().forEach(dep -> {
            links.add(GraphLink.builder()
                    .source(dep.getId().toString())
                    .target(component.getId().toString())
                    .value(1)
                    .build());
        });

        return links;
    }

    public Map<String, Object> getGraphData(Long projectId) {
        List<DependencyEdge> edges = dependencyEdgeRepository.findAll();
        
        Set<Component> nodes = new java.util.HashSet<>();
        List<Map<String, Object>> edgesList = new ArrayList<>();
        
        for (DependencyEdge dependency : edges) {
            Component source = dependency.getSourceComponent();
            Component target = dependency.getTargetComponent();
            
            if (source != null && target != null) {
                nodes.add(source);
                nodes.add(target);
                
                Map<String, Object> edge = new HashMap<>();
                edge.put("source", source.getId());
                edge.put("target", target.getId());
                edge.put("type", dependency.getType());
                edge.put("scope", dependency.getScope());
                edge.put("direct", dependency.getDirect());
                edge.put("purl", dependency.getPurl());
                edgesList.add(edge);
            }
        }
        
        List<Map<String, Object>> nodesList = nodes.stream()
            .map(node -> {
                Map<String, Object> nodeMap = new HashMap<>();
                nodeMap.put("id", node.getId());
                nodeMap.put("name", node.getName());
                nodeMap.put("version", node.getVersion());
                nodeMap.put("type", node.getType());
                nodeMap.put("purl", node.getPurl());
                return nodeMap;
            })
            .collect(Collectors.toList());
        
        Map<String, Object> result = new HashMap<>();
        result.put("nodes", nodesList);
        result.put("edges", edgesList);
        
        return result;
    }
} 