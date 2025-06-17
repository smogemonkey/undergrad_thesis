package com.vulnview.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import com.vulnview.entity.Component;
import com.vulnview.entity.Vulnerability;
import com.vulnview.entity.ComponentVulnerability;
import com.vulnview.model.ScanProgress;
import com.vulnview.repository.ComponentRepository;
import com.vulnview.repository.VulnerabilityRepository;
import com.vulnview.repository.ComponentVulnerabilityRepository;
import com.vulnview.repository.SbomRepository;
import com.vulnview.repository.RepositoryRepository;
import com.vulnview.entity.Sbom;
import com.vulnview.entity.Repository;
import com.vulnview.entity.RiskLevel;
import com.vulnview.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.MDC;
import org.apache.commons.io.FileUtils;

import java.io.*;
import java.nio.file.*;
import java.util.*;
import java.util.concurrent.*;

@Slf4j
@Service
@RequiredArgsConstructor
public class SnykScanService {
    private final ComponentRepository componentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final ComponentVulnerabilityRepository componentVulnerabilityRepository;
    private final ObjectMapper objectMapper;
    private final ExecutorService executorService = Executors.newFixedThreadPool(5);
    private final Map<String, ScanProgress> scanProgressMap = new ConcurrentHashMap<>();
    private final SnykResultProcessor snykResultProcessor;
    private final SbomRepository sbomRepository;
    private final RepositoryRepository repositoryRepository;
    private final Map<Long, String> scanResultsCache = new ConcurrentHashMap<>();

    @Value("${snyk.token}")
    private String snykToken;

    @Value("${snyk.scripts.path}")
    private String scriptsPath;

    @Transactional
    public String startScanForSbom(Long sbomId) {
        final String scanId = String.format("snyk_scan_%d_%s", sbomId, UUID.randomUUID().toString());
        
        try {
            MDC.put("scanId", scanId);
            log.info("Starting Snyk scan processing for SBOM: {}", sbomId);
            
            // Get SBOM and repository information
            Sbom sbom = sbomRepository.findById(sbomId)
                .orElseThrow(() -> new IllegalArgumentException("SBOM not found with ID: " + sbomId));
            
            Repository repository = sbom.getRepository();
            if (repository == null) {
                throw new IllegalArgumentException("Repository not found for SBOM: " + sbomId);
            }

            if (repository.getLocalPath() == null || repository.getLocalPath().isEmpty()) {
                throw new RuntimeException("Repository local path not found");
            }

            File repoDir = new File(repository.getLocalPath());
            if (!repoDir.exists() || !repoDir.isDirectory()) {
                throw new RuntimeException("Repository directory not found: " + repository.getLocalPath());
            }

            // Initialize scan progress
            final ScanProgress progress = new ScanProgress();
            progress.setStatus("IN_PROGRESS");
            progress.setTotalComponents(0);
            progress.setProcessedComponents(0);
            scanProgressMap.put(scanId, progress);

            try {
                // Run Snyk test and get JSON output
                ProcessBuilder pb = new ProcessBuilder("snyk", "test", "--json");
                pb.directory(repoDir);
                
                // Set Snyk token if available
                if (snykToken != null && !snykToken.isEmpty()) {
                    Map<String, String> env = pb.environment();
                    env.put("SNYK_TOKEN", snykToken);
                }
                
                Process process = pb.start();

                // Read the output
                StringBuilder output = new StringBuilder();
                try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        output.append(line).append("\n");
                    }
                }

                // Wait for process to complete with timeout
                if (!process.waitFor(5, TimeUnit.MINUTES)) {
                    process.destroy();
                    throw new RuntimeException("Snyk scan timed out");
                }

                String snykResults = output.toString();
                log.info("Parsing Snyk scan results...");

                // Process results in a new transaction
                processSnykResults(snykResults, sbomId, repository.getId(), progress, scanId);

                return scanId;
            } catch (Exception e) {
                log.error("Error in scan process: {}", e.getMessage(), e);
                progress.setStatus("FAILED");
                progress.setErrorMessage(e.getMessage());
                scanProgressMap.put(scanId, progress);
                return null;
            }
        } finally {
            MDC.remove("scanId");
        }
    }

    @Transactional
    protected void processSnykResults(String snykResults, Long sbomId, Long repoId, ScanProgress progress, String scanId) {
        try {
            // Parse and process results
            JsonNode root = objectMapper.readTree(snykResults);
            JsonNode vulns = root.get("vulnerabilities");
            
            if (vulns == null || !vulns.isArray()) {
                log.warn("No vulnerabilities array found in scan results");
                progress.setStatus("COMPLETED");
                progress.setTotalComponents(0);
                progress.setProcessedComponents(0);
                scanProgressMap.put(scanId, progress);
                return;
            }

            // Cache the raw results
            scanResultsCache.put(repoId, snykResults);

            // Get fresh references in new transaction
            Sbom sbom = sbomRepository.findById(sbomId)
                .orElseThrow(() -> new IllegalArgumentException("SBOM not found with ID: " + sbomId));

            // Process vulnerabilities
            int totalVulns = vulns.size();
            progress.setTotalComponents(totalVulns);
            scanProgressMap.put(scanId, progress);

            for (JsonNode vuln : vulns) {
                try {
                    // Parse and process results
                    final String packageName = vuln.path("packageName").asText();
                    final String version = vuln.path("version").asText();
                    final String severity = vuln.path("severity").asText();
                    final double cvssScore = vuln.path("cvssScore").asDouble();
                    
                    // Get CVE ID
                    String cveId = null;
                    JsonNode identifiers = vuln.path("identifiers");
                    if (identifiers.has("CVE") && identifiers.get("CVE").isArray() && identifiers.get("CVE").size() > 0) {
                        cveId = identifiers.get("CVE").get(0).asText();
                    }
                    final String finalCveId = cveId;

                    // Find or create component
                    final Long finalSbomId = sbomId;
                    final Component component = componentRepository.findByNameAndVersionAndSbomId(packageName, version, finalSbomId)
                        .orElseGet(() -> {
                            Component newComponent = new Component();
                            newComponent.setName(packageName);
                            newComponent.setVersion(version);
                            newComponent.setSbom(sbom);
                            return componentRepository.save(newComponent);
                        });

                    // Find or create vulnerability
                    final Vulnerability vulnerability;
                    if (finalCveId != null) {
                        vulnerability = vulnerabilityRepository.findByCveId(finalCveId)
                            .orElseGet(() -> {
                                Vulnerability newVuln = Vulnerability.builder()
                                    .cveId(finalCveId)
                                    .severity(severity)
                                    .cvssScore(cvssScore)
                                    .riskLevel(getRiskLevelEnum(cvssScore))
                                    .build();
                                return vulnerabilityRepository.saveAndFlush(newVuln);
                            });
                    } else {
                        // For vulnerabilities without CVE, create a new one
                        String synkId = "SNYK-" + UUID.randomUUID().toString();
                        vulnerability = Vulnerability.builder()
                            .cveId(synkId)
                            .severity(severity)
                            .cvssScore(cvssScore)
                            .riskLevel(getRiskLevelEnum(cvssScore))
                            .build();
                        vulnerabilityRepository.saveAndFlush(vulnerability);
                    }

                    // Link component to vulnerability using the helper method
                    vulnerability.addComponent(component, sbom);
                    componentRepository.saveAndFlush(component);

                    // Update component risk level if needed
                    if (component.getRiskLevel() == null || 
                        getRiskLevelEnum(cvssScore).compareTo(component.getRiskLevel()) > 0) {
                        component.setRiskLevel(getRiskLevelEnum(cvssScore));
                        componentRepository.saveAndFlush(component);
                    }

                    progress.incrementProcessedComponents();
                    scanProgressMap.put(scanId, progress);

                } catch (Exception e) {
                    log.error("Error processing vulnerability: {}", e.getMessage(), e);
                }
            }

            progress.setStatus("COMPLETED");
            scanProgressMap.put(scanId, progress);
            log.info("Completed processing {} vulnerabilities", totalVulns);

        } catch (Exception e) {
            log.error("Error processing Snyk results: {}", e.getMessage(), e);
            progress.setStatus("FAILED");
            progress.setErrorMessage(e.getMessage());
            scanProgressMap.put(scanId, progress);
        }
    }

    public Map<String, Object> getRawSnykResults(Long repositoryId) {
        Repository repository = repositoryRepository.findById(repositoryId)
            .orElseThrow(() -> new RuntimeException("Repository not found"));

        if (repository.getLocalPath() == null || repository.getLocalPath().isEmpty()) {
            throw new RuntimeException("Repository local path not found");
        }

        File repoDir = new File(repository.getLocalPath());
        if (!repoDir.exists() || !repoDir.isDirectory()) {
            throw new RuntimeException("Repository directory not found: " + repository.getLocalPath());
        }

        try {
            // Run Snyk test and get JSON output
            ProcessBuilder pb = new ProcessBuilder("snyk", "test", "--json");
            pb.directory(repoDir);
            Process process = pb.start();

            // Read the output
            StringBuilder output = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                output.append(line).append("\n");
                }
            }

            // Wait for process to complete with timeout
            if (!process.waitFor(5, TimeUnit.MINUTES)) {
                process.destroy();
                throw new RuntimeException("Snyk scan timed out");
            }

            // Cache the raw results for later processing
            scanResultsCache.put(repositoryId, output.toString());

            // Parse and process the results
            JsonNode root = objectMapper.readTree(output.toString());
            List<Map<String, Object>> processedComponents = new ArrayList<>();
            JsonNode vulns = root.get("vulnerabilities");
            
            if (vulns != null && vulns.isArray()) {
                Map<String, Map<String, Object>> components = new HashMap<>();
                
                for (JsonNode vuln : vulns) {
                    // Parse and process results
                    final String packageName = vuln.path("packageName").asText();
                    final String version = vuln.path("version").asText();
                    final String severity = vuln.path("severity").asText();
                    final double cvssScore = vuln.path("cvssScore").asDouble();
                    
                    // Get CVE ID
                    String cveId = null;
                    JsonNode identifiers = vuln.path("identifiers");
                    if (identifiers.has("CVE") && identifiers.get("CVE").isArray() && identifiers.get("CVE").size() > 0) {
                        cveId = identifiers.get("CVE").get(0).asText();
                    }
                    final String finalCveId = cveId;
                    
                    // Process component
                    String componentKey = packageName + "@" + version;
                    Map<String, Object> component = components.computeIfAbsent(componentKey, k -> {
                        Map<String, Object> c = new HashMap<>();
                        c.put("name", packageName);
                        c.put("version", version);
                        c.put("vulnerabilities", new ArrayList<Map<String, Object>>());
                        return c;
                    });
                    
                    // Set risk level based on CVSS score
                    component.put("riskLevel", getRiskLevel(cvssScore));
                    
                    // Check if direct dependency
                    JsonNode fromPath = vuln.path("from");
                    if (fromPath != null && fromPath.isArray()) {
                        component.put("isDirectDependency", fromPath.size() <= 2);
                    }
                    
                    // Add vulnerability
                    Map<String, Object> vulnerability = new HashMap<>();
                    vulnerability.put("cveId", finalCveId != null ? finalCveId : vuln.path("id").asText());
                    vulnerability.put("severity", severity);
                    vulnerability.put("cvssScore", cvssScore);
                    ((List<Map<String, Object>>) component.get("vulnerabilities")).add(vulnerability);
                }
                
                processedComponents.addAll(components.values());
            }

            return Map.of(
                "repositoryId", repositoryId,
                "components", processedComponents,
                "timestamp", new Date()
            );

        } catch (Exception e) {
            log.error("Error getting raw Snyk results", e);
            throw new RuntimeException("Failed to get Snyk results: " + e.getMessage());
        }
    }

    @Transactional
    private void updateVulnerabilities(Long sbomId, Map<String, Object> scanResults) {
        log.info("Starting to process vulnerabilities for SBOM: {}", sbomId);
        
        // Get SBOM and verify it exists
        Sbom sbom = sbomRepository.findById(sbomId)
            .orElseThrow(() -> new RuntimeException("SBOM not found with ID: " + sbomId));
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> components = (List<Map<String, Object>>) scanResults.get("components");
        
        if (components == null || components.isEmpty()) {
            log.warn("No components found in scan results");
            return;
        }
        
        log.info("Processing {} components from scan results", components.size());
        
        // Clear existing vulnerabilities for this SBOM
        log.info("Clearing existing vulnerabilities for SBOM: {}", sbomId);
        componentVulnerabilityRepository.deleteBySbomId(sbomId);
        
        for (Map<String, Object> componentData : components) {
            String packageName = (String) componentData.get("name");
            String version = (String) componentData.get("version");
            
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> vulns = (List<Map<String, Object>>) componentData.get("vulnerabilities");
            
            if (vulns == null || vulns.isEmpty()) {
                log.info("No vulnerabilities found for component: {}@{}", packageName, version);
                continue;
            }
            
            // Find component by name and version
            Component component = componentRepository.findByNameAndVersionAndSbomId(packageName, version, sbomId)
                .orElse(null);
            
            if (component == null) {
                log.warn("Component not found in database: {}@{} for SBOM: {}. Skipping vulnerabilities.", 
                    packageName, version, sbomId);
                continue;
            }

            log.info("Found component in database: {}@{}", component.getName(), component.getVersion());
            
            // Calculate highest CVSS score for risk level
            double maxCvssScore = vulns.stream()
                .mapToDouble(v -> ((Number) v.get("cvssScore")).doubleValue())
                .max()
                .orElse(0.0);
            
            // Set component risk level
            RiskLevel newRiskLevel = getRiskLevelEnum(maxCvssScore);
            component.setRiskLevel(newRiskLevel);
            
            // Clear existing vulnerabilities for this component
            component.getComponentVulnerabilities().clear();
            
            // Process each vulnerability
            for (Map<String, Object> vulnData : vulns) {
                String cveId = (String) vulnData.get("cveId");
                String severity = (String) vulnData.get("severity");
                Double cvssScore = ((Number) vulnData.get("cvssScore")).doubleValue();
                
                // Create or get vulnerability
                Vulnerability vulnerability = vulnerabilityRepository.findByCveId(cveId)
                    .orElseGet(() -> {
                        String description = String.format("Vulnerability in %s@%s with CVSS score %.1f (%s)", 
                            packageName, version, cvssScore, severity);
                        
                        Vulnerability newVuln = Vulnerability.builder()
                            .cveId(cveId)
                            .severity(severity)
                            .cvssScore(cvssScore)
                            .description(description)
                            .build();
                        return vulnerabilityRepository.save(newVuln);
                    });
                
                // Create new component vulnerability relationship
                ComponentVulnerability cv = ComponentVulnerability.builder()
                    .component(component)
                    .vulnerability(vulnerability)
                    .severity(severity)
                    .score(cvssScore)
                    .sbom(sbom)
                    .build();
                
                // Add to collections
                component.getComponentVulnerabilities().add(cv);
                vulnerability.getComponentVulnerabilities().add(cv);
                
                // Save the relationship
                componentVulnerabilityRepository.saveAndFlush(cv);
                
                log.info("Created vulnerability relationship: {}@{} -> {} (severity: {}, score: {})", 
                    packageName, version, cveId, severity, cvssScore);
            }
            
            // Save component with updated risk level and relationships
            componentRepository.save(component);
        }
        
        log.info("Completed processing vulnerabilities for SBOM: {}", sbomId);
    }

    private Vulnerability createVulnerability(Map<String, Object> vulnData) {
        Map<String, List<String>> identifiers = (Map<String, List<String>>) vulnData.get("identifiers");
        String cveId = identifiers.get("CVE").get(0);
        String severity = (String) vulnData.get("severity");
        Double cvssScore = ((Number) vulnData.get("cvssScore")).doubleValue();
        
        return vulnerabilityRepository.findByCveId(cveId)
            .orElseGet(() -> vulnerabilityRepository.save(Vulnerability.builder()
                .cveId(cveId)
                .severity(severity)
                .cvssScore(cvssScore)
                .description((String) vulnData.get("description"))
                .build()));
    }

    public ScanProgress getProgress(String scanId) {
        return scanProgressMap.get(scanId);
    }

    public Map<String, Object> getScanResults(String scanId) {
        ScanProgress progress = scanProgressMap.get(scanId);
        if (progress == null) {
            return Collections.emptyMap();
        }

        Map<String, Object> results = new HashMap<>();
        results.put("status", progress.getStatus());
        if (progress.getErrorMessage() != null) {
            results.put("error", progress.getErrorMessage());
        }
        return results;
    }

    private String getRiskLevel(double cvssScore) {
        if (cvssScore >= 9.0) return "CRITICAL";
        if (cvssScore >= 7.0) return "HIGH";
        if (cvssScore >= 4.0) return "MEDIUM";
        if (cvssScore > 0.0) return "LOW";
        return "NONE";
    }

    private RiskLevel getRiskLevelEnum(double cvssScore) {
        if (cvssScore >= 9.0) return RiskLevel.CRITICAL;
        if (cvssScore >= 7.0) return RiskLevel.HIGH;
        if (cvssScore >= 4.0) return RiskLevel.MEDIUM;
        if (cvssScore > 0.0) return RiskLevel.LOW;
        return RiskLevel.UNKNOWN;
    }
} 