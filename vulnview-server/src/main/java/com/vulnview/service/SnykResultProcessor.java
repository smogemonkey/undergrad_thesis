package com.vulnview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.vulnview.entity.Repository;
import com.vulnview.entity.Component;
import com.vulnview.entity.Vulnerability;
import com.vulnview.entity.ComponentVulnerability;
import com.vulnview.repository.ComponentRepository;
import com.vulnview.repository.VulnerabilityRepository;
import com.vulnview.repository.ComponentVulnerabilityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;
import org.slf4j.MDC;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SnykResultProcessor {
    private final ComponentRepository componentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final ComponentVulnerabilityRepository componentVulnerabilityRepository;

    @Transactional
    public void processResults(Repository repository, JsonNode scanResults) {
        String processingId = "process_" + UUID.randomUUID().toString();
        try {
            MDC.put("scanId", processingId);
            log.info("=================================================");
            log.info("            PROCESSING SNYK RESULTS               ");
            log.info("=================================================");
            log.info("Repository: {}", repository.getName());
            log.info("Processing ID: {}", processingId);
            
            // Clear existing vulnerabilities for this repository's components
            log.info("Clearing existing vulnerabilities for repository");
            componentVulnerabilityRepository.deleteByComponentRepositoryId(repository.getId());
            log.info("Existing vulnerabilities cleared successfully");
            
            if (scanResults.has("vulnerabilities")) {
                JsonNode vulnerabilities = scanResults.get("vulnerabilities");
                log.info("Found {} vulnerabilities to process", vulnerabilities.size());
                
                int processedCount = 0;
                int skippedCount = 0;
                
                for (JsonNode vuln : vulnerabilities) {
                    String packageName = vuln.get("packageName").asText();
                    String version = vuln.get("version").asText();
                    
                    log.debug("Processing vulnerability for package: {}@{}", packageName, version);
                    
                    // Find existing component - skip if not found
                    Optional<Component> componentOpt = componentRepository.findByNameAndVersionAndRepositoryId(
                            packageName, version, repository.getId());
                    
                    if (componentOpt.isEmpty()) {
                        log.warn("Component not found for package: {}@{} in repository: {}", 
                            packageName, version, repository.getName());
                        skippedCount++;
                        continue;
                    }
                    
                    Component component = componentOpt.get();
                    log.debug("Found component: {}", component.getName());
                    
                    // Create vulnerability
                    log.debug("Creating/updating vulnerability");
                    Vulnerability vulnerability = createOrUpdateVulnerability(vuln);
                    log.debug("Vulnerability processed: {}", vulnerability.getCveId());
                    
                    // Create component vulnerability relationship
                    log.debug("Creating component-vulnerability relationship");
                    ComponentVulnerability cv = ComponentVulnerability.builder()
                        .component(component)
                        .vulnerability(vulnerability)
                        .severity(vuln.get("severity").asText())
                        .score(vuln.has("cvssScore") ? vuln.get("cvssScore").asDouble() : 0.0)
                        .build();
                    
                    componentVulnerabilityRepository.save(cv);
                    log.debug("Added vulnerability {} to component {}", 
                        vulnerability.getCveId(), component.getName());
                    
                    processedCount++;
                    if (processedCount % 100 == 0) {
                        log.info("Processed {} vulnerabilities so far", processedCount);
                    }
                }
                
                log.info("=================================================");
                log.info("            PROCESSING SUMMARY                    ");
                log.info("=================================================");
                log.info("Total vulnerabilities found: {}", vulnerabilities.size());
                log.info("Successfully processed: {}", processedCount);
                log.info("Skipped (component not found): {}", skippedCount);
            } else {
                log.info("No vulnerabilities found in scan results for repository: {}", repository.getName());
            }
            
            log.info("=================================================");
            log.info("            PROCESSING COMPLETED                  ");
            log.info("=================================================");
        } catch (Exception e) {
            log.error("=================================================");
            log.error("            PROCESSING FAILED                     ");
            log.error("=================================================");
            log.error("Error processing Snyk scan results: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process Snyk scan results: " + e.getMessage());
        } finally {
            MDC.remove("scanId");
        }
    }
    
    private Vulnerability createOrUpdateVulnerability(final JsonNode vulnData) {
        String cveId = extractCveId(vulnData);
        
        if (cveId != null) {
            log.debug("Processing vulnerability with CVE ID: {}", cveId);
            return vulnerabilityRepository.findByCveId(cveId)
                .orElseGet(() -> {
                    log.debug("Creating new vulnerability for CVE: {}", cveId);
                    return createNewVulnerability(vulnData, cveId);
                });
        } else {
            String snykId = "SNYK-" + vulnData.get("id").asText();
            log.debug("No CVE ID found, using Snyk ID: {}", snykId);
            return createNewVulnerability(vulnData, snykId);
        }
    }
    
    private String extractCveId(final JsonNode vulnData) {
        if (vulnData.has("identifiers") && vulnData.get("identifiers").has("CVE")) {
            JsonNode cves = vulnData.get("identifiers").get("CVE");
            if (cves.size() > 0) {
                String cveId = cves.get(0).asText();
                log.debug("Extracted CVE ID: {}", cveId);
                return cveId;
            }
        }
        log.debug("No CVE ID found in vulnerability data");
        return null;
    }
    
    private Vulnerability createNewVulnerability(final JsonNode vulnData, final String id) {
        log.debug("Creating new vulnerability with ID: {}", id);
        Vulnerability vulnerability = vulnerabilityRepository.save(Vulnerability.builder()
            .cveId(id)
            .title(vulnData.get("title").asText())
            .description(vulnData.get("description").asText())
            .severity(vulnData.get("severity").asText())
            .cvssScore(vulnData.has("cvssScore") ? vulnData.get("cvssScore").asDouble() : 0.0)
            .build());
        log.debug("Created new vulnerability: {}", vulnerability.getCveId());
        return vulnerability;
    }
} 