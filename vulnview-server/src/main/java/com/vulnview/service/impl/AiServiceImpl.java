package com.vulnview.service.impl;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.GenerateContentResponse;
import com.vulnview.dto.ai.*;
import com.vulnview.entity.*;
import com.vulnview.repository.*;
import com.vulnview.service.AiService;
import com.vulnview.service.VulnerabilityEnrichmentService;
import com.vulnview.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class AiServiceImpl implements AiService {
    private final ComponentRepository componentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final SbomRepository sbomRepository;
    private final ObjectMapper objectMapper;
    private final BuildRepository buildRepository;
    private final SbomDependencyRepository sbomDependencyRepository;
    private final VulnerabilityEnrichmentService vulnerabilityEnrichmentService;
    private final ComponentVulnerabilityRepository componentVulnerabilityRepository;
    private final Client genAiClient;
    private final RestTemplate restTemplate;
    private final DependencyEdgeRepository dependencyEdgeRepository;
    private final AiSolutionRepository aiSolutionRepository;

    @Value("${vulnview.ai.api.key}")
    private String aiApiKey;

    @Value("${vulnview.ai.api.url}")
    private String aiApiUrl;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "aiRemediationCache", key = "#requestDto.vulnerabilityDbId + '-' + #requestDto.affectedComponentPurl")
    public AiRemediationResponseDto getRemediationSuggestion(AiRemediationRequestDto requestDto) {
        log.info("Getting AI remediation suggestion for vulnerability {} and component {}", 
            requestDto.getVulnerabilityDbId(), requestDto.getAffectedComponentPurl());

        Vulnerability vulnerability = vulnerabilityRepository.findByCveId(requestDto.getVulnerabilityDbId())
            .orElseThrow(() -> new RuntimeException("Vulnerability not found"));

        Component component = componentRepository.findByPurl(requestDto.getAffectedComponentPurl())
            .orElseThrow(() -> new RuntimeException("Component not found"));

        String componentContext = String.format(
            "Component Name: %s, Version: %s, PURL: %s. This component has %d known direct vulnerabilities.",
            component.getName(), component.getVersion(), component.getPurl(), 
            component.getComponentVulnerabilities().size()
        );

        String vulnerabilityContext = String.format(
            "Vulnerability ID: %s, Severity: %s, CVSS Score: %s. Description: %s.",
            vulnerability.getCveId(), vulnerability.getSeverity(), 
            vulnerability.getCvssScore(), vulnerability.getDescription()
        );

        String projectContext = requestDto.getProjectContextDescription() != null ? 
            "Additional project context: " + requestDto.getProjectContextDescription() : "";

        // Prepare the prompt for Gemini
        String prompt = String.format(
            "You are a security expert. Analyze the following component and vulnerability information. " +
            "Component Context: %s. Vulnerability Context: %s. %s " +
            "Your task is to provide concise, actionable remediation advice. " +
            "Return your response as a JSON object matching this schema: " +
            "{\"vulnerabilitySummary\": \"brief summary of the vulnerability\", " +
            "\"componentContextSummary\": \"brief summary of the component context\", " +
            "\"suggestedRemediations\": [{\"type\": \"UPGRADE_VERSION\"|\"CONFIGURATION_CHANGE\"|\"CODE_MODIFICATION\"|\"WORKAROUND\", " +
            "\"description\": \"detailed steps\", \"codeSnippet\": \"optional code\", " +
            "\"confidence\": \"HIGH\"|\"MEDIUM\"|\"LOW\", \"estimatedEffort\": \"LOW\"|\"MEDIUM\"|\"HIGH\"}], " +
            "\"overallRiskAssessment\": \"brief summary\", \"disclaimer\": \"AI generated advice...\"}. " +
            "Prioritize upgrade advice if a fixed version is known. Be specific.",
            componentContext, vulnerabilityContext, projectContext
        );

        log.info("Sending prompt to Gemini API: {}", prompt);

        try {
            // Generate content using Gemini
            GenerateContentResponse response = genAiClient.models.generateContent(
                "gemini-1.5-flash",
                prompt,
                null
            );

            String jsonResponse = response.text();
            log.info("Gemini API generated JSON response: {}", jsonResponse);
            return parseRemediationResponse(jsonResponse);
        } catch (Exception e) {
            log.error("Error calling AI API: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to call AI API", e);
        }
    }

    private AiRemediationResponseDto parseRemediationResponse(String response) {
        try {
            // Remove markdown code block formatting if present
            String jsonContent = response;
            if (response.startsWith("```json")) {
                jsonContent = response.substring(7);
            }
            if (jsonContent.endsWith("```")) {
                jsonContent = jsonContent.substring(0, jsonContent.length() - 3);
            }
            jsonContent = jsonContent.trim();

            AiRemediationResponseDto parsedResponse = objectMapper.readValue(jsonContent, AiRemediationResponseDto.class);
            log.info("Parsed remediation response: {}", parsedResponse);
            return parsedResponse;
        } catch (Exception e) {
            log.error("Error parsing remediation response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse remediation response", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(value = "aiAlternativeCache", key = "#requestDto.currentPackagePurl")
    public AiAlternativeResponseDto suggestAlternativePackages(AiAlternativeRequestDto requestDto) {
        log.info("Getting AI alternative package suggestions for package {}", requestDto.getCurrentPackagePurl());

        Component currentComponent = componentRepository.findByPurl(requestDto.getCurrentPackagePurl())
            .orElseThrow(() -> new RuntimeException("Component not found"));

        // Get vulnerabilities through the component's relationship
        Set<Vulnerability> vulnerabilities = currentComponent.getVulnerabilities();
        
        // Build detailed vulnerability context
        StringBuilder vulnerabilityContext = new StringBuilder();
        vulnerabilityContext.append("Current Package Vulnerabilities:\n");
        
        if (vulnerabilities.isEmpty()) {
            vulnerabilityContext.append("No known vulnerabilities found for this package version.\n");
        } else {
            for (Vulnerability vuln : vulnerabilities) {
                vulnerabilityContext.append(String.format(
                    "\nVulnerability Details:\n" +
                    "CVE ID: %s\n" +
                    "Title: %s\n" +
                    "Description: %s\n" +
                    "Severity: %s\n" +
                    "Risk Level: %s\n" +
                    "CVSS Score: %s\n" +
                    "CVSS Vector: %s\n" +
                    "CWE: %s\n" +
                    "Published Date: %s\n" +
                    "Last Modified: %s\n" +
                    "Source: %s\n" +
                    "EPSS Score: %s\n" +
                    "CISA KEV: %s\n" +
                    "Remediation: %s\n" +
                    "Recommendation: %s\n",
                    vuln.getCveId(),
                    vuln.getTitle(),
                    vuln.getDescription(),
                    vuln.getSeverity(),
                    vuln.getRiskLevel(),
                    vuln.getCvssScore(),
                    vuln.getCvssVector(),
                    vuln.getCwe(),
                    vuln.getPublishedDate(),
                    vuln.getLastModifiedDate(),
                    vuln.getSource(),
                    vuln.getEpssScore() != null ? String.format("%.2f", vuln.getEpssScore()) : "N/A",
                    vuln.isInCisaKev() ? "Yes" : "No",
                    vuln.getRemediation() != null ? vuln.getRemediation() : "Not available",
                    vuln.getRecommendation() != null ? vuln.getRecommendation() : "Not available"
                ));
            }
        }

        String componentContext = String.format(
            "Current Package Information:\n" +
            "Name: %s\n" +
            "Version: %s\n" +
            "PURL: %s\n" +
            "Type: %s\n" +
            "Group: %s\n" +
            "Total Vulnerabilities: %d\n\n" +
            "%s",
            currentComponent.getName(),
            currentComponent.getVersion(),
            currentComponent.getPurl(),
            currentComponent.getType(),
            currentComponent.getGroupName(),
            vulnerabilities.size(),
            vulnerabilityContext.toString()
        );

        String projectContext = requestDto.getProjectContextDescription() != null ?
            "Additional project context: " + requestDto.getProjectContextDescription() : "";

        String desiredCharacteristics = !requestDto.getDesiredCharacteristics().isEmpty() ?
            "Desired characteristics: " + String.join(", ", requestDto.getDesiredCharacteristics()) : "";

        String constraints = !requestDto.getConstraints().isEmpty() ?
            "Constraints: " + String.join(", ", requestDto.getConstraints()) : "";

        // Prepare the prompt for Gemini
        String prompt = String.format(
            "You are a security expert. Analyze the following package and its vulnerabilities:\n\n%s\n\n%s\n\n%s\n\n%s\n\n" +
            "Your task is to suggest alternative packages that are more secure and maintain similar functionality. " +
            "Consider the following when making suggestions:\n" +
            "1. Security track record and known vulnerabilities\n" +
            "2. Active maintenance and community support\n" +
            "3. Compatibility with existing codebase\n" +
            "4. Performance and reliability\n" +
            "5. License compatibility\n\n" +
            "Return your response as a JSON object matching this schema:\n" +
            "{\"currentPackageSummary\": \"brief summary of current package\",\n" +
            "\"vulnerabilitySummary\": \"summary of vulnerabilities\",\n" +
            "\"suggestedAlternatives\": [{\"name\": \"package name\",\n" +
            "\"version\": \"recommended version\",\n" +
            "\"purl\": \"package URL\",\n" +
            "\"description\": \"brief description\",\n" +
            "\"securityBenefits\": [\"list of security benefits\"],\n" +
            "\"compatibilityNotes\": \"compatibility information\",\n" +
            "\"migrationEffort\": \"LOW\"|\"MEDIUM\"|\"HIGH\",\n" +
            "\"confidence\": \"HIGH\"|\"MEDIUM\"|\"LOW\"}],\n" +
            "\"overallRecommendation\": \"brief summary\",\n" +
            "\"disclaimer\": \"AI generated advice...\"}.\n" +
            "Prioritize packages with good security track records and active maintenance.",
            componentContext, projectContext, desiredCharacteristics, constraints
        );

        log.info("Sending prompt to Gemini API for alternative package suggestions");

        try {
            // Generate content using Gemini
            GenerateContentResponse response = genAiClient.models.generateContent(
                "gemini-1.5-flash",
                prompt,
                null
            );

            String jsonResponse = response.text();
            log.info("Gemini API generated JSON response for alternative packages");
            return parseAlternativeResponse(jsonResponse);
        } catch (Exception e) {
            log.error("Error calling AI API for alternative packages: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to call AI API for alternative packages", e);
        }
    }

    private AiAlternativeResponseDto parseAlternativeResponse(String response) {
        try {
            // Remove markdown code block formatting if present
            String jsonContent = response;
            if (response.startsWith("```json")) {
                jsonContent = response.substring(7);
            }
            if (jsonContent.endsWith("```")) {
                jsonContent = jsonContent.substring(0, jsonContent.length() - 3);
            }
            jsonContent = jsonContent.trim();

            AiAlternativeResponseDto parsedResponse = objectMapper.readValue(jsonContent, AiAlternativeResponseDto.class);
            log.info("Parsed alternative response: {}", parsedResponse);
            return parsedResponse;
        } catch (Exception e) {
            log.error("Error parsing alternative response: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to parse alternative response", e);
        }
    }

    @Override
    @Transactional
    public void triggerEnrichmentForComponent(Long componentId) {
        vulnerabilityEnrichmentService.enrichVulnerabilitiesForComponentAsync(componentId);
    }

    @Override
    @Transactional
    public void triggerEnrichmentForBuild(Long buildId) {
        vulnerabilityEnrichmentService.enrichVulnerabilitiesForSbomAsync(buildId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getVulnerableComponents(Long sbomId) {
        Sbom sbom = sbomRepository.findById(sbomId)
                .orElseThrow(() -> new RuntimeException("SBOM not found"));

        List<Component> components = componentRepository.findBySbomId(sbomId);
        List<ComponentVulnerability> vulnerabilities = componentVulnerabilityRepository.findBySbomId(sbomId);

        Map<Long, List<ComponentVulnerability>> vulnerabilitiesByComponent = vulnerabilities.stream()
                .collect(Collectors.groupingBy(ComponentVulnerability::getComponentId));

        return components.stream()
                .filter(component -> vulnerabilitiesByComponent.containsKey(component.getId()))
                .map(component -> {
                    Map<String, Object> result = new HashMap<>();
                    result.put("id", component.getId());
                    result.put("name", component.getName());
                    result.put("version", component.getVersion());
                    result.put("vulnerabilities", vulnerabilitiesByComponent.get(component.getId()).stream()
                            .map(vuln -> {
                                Map<String, Object> vulnMap = new HashMap<>();
                                vulnMap.put("id", vuln.getId());
                                vulnMap.put("cveId", vuln.getCve());
                                vulnMap.put("title", vuln.getDescription());
                                vulnMap.put("severity", vuln.getSeverity());
                                vulnMap.put("cvssScore", vuln.getScore());
                                return vulnMap;
                            })
                            .collect(Collectors.toList()));
                    return result;
                })
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Map<String, Object> analyzeSbom(Long sbomId) {
        List<Map<String, Object>> vulnerableComponents = getVulnerableComponents(sbomId);
        
        Map<String, Object> analysis = new HashMap<>();
        analysis.put("totalComponents", vulnerableComponents.size());
        analysis.put("vulnerableComponents", vulnerableComponents);
        
        // Calculate statistics
        Map<String, Long> severityCounts = vulnerableComponents.stream()
                .flatMap(comp -> ((List<Map<String, Object>>) comp.get("vulnerabilities")).stream())
                .map(vuln -> (String) vuln.get("severity"))
                .collect(Collectors.groupingBy(
                        severity -> severity,
                        Collectors.counting()
                ));
        
        analysis.put("severityCounts", severityCounts);
        
        // Calculate average CVSS score
        double avgCvssScore = vulnerableComponents.stream()
                .flatMap(comp -> ((List<Map<String, Object>>) comp.get("vulnerabilities")).stream())
                .mapToDouble(vuln -> (Double) vuln.get("cvssScore"))
                .average()
                .orElse(0.0);
        
        analysis.put("averageCvssScore", avgCvssScore);
        
        return analysis;
    }

    @Override
    public AiSummaryResponse generateVulnerabilitySummary(List<Component> components) {
        try {
            // Prepare components with vulnerabilities
            List<Map<String, Object>> componentData = components.stream()
                    .filter(comp -> !comp.getComponentVulnerabilities().isEmpty())
                    .map(comp -> {
                        Map<String, Object> data = new HashMap<>();
                        data.put("name", comp.getName());
                        data.put("version", comp.getVersion());
                        data.put("type", comp.getType());
                        data.put("vulnerabilities", comp.getComponentVulnerabilities().stream()
                                .map(cv -> {
                                    Vulnerability vuln = cv.getVulnerability();
                                    Map<String, Object> vulnData = new HashMap<>();
                                    vulnData.put("cveId", vuln.getCveId());
                                    vulnData.put("severity", vuln.getSeverity());
                                    vulnData.put("description", vuln.getDescription());
                                    return vulnData;
                                })
                                .collect(Collectors.toList()));
                        return data;
                    })
                    .collect(Collectors.toList());

            // Prepare prompt for Gemini
            String prompt = String.format(
                "Analyze these vulnerable components and provide a concise summary:\n%s",
                objectMapper.writeValueAsString(componentData)
            );

            // Call Gemini API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("x-goog-api-key", aiApiKey);

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("contents", Collections.singletonList(
                Map.of("parts", Collections.singletonList(
                    Map.of("text", prompt)
                ))
            ));

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(requestBody, headers);
            Map<String, Object> response = restTemplate.postForObject(aiApiUrl, request, Map.class);

            // Extract summary from response
            String summary = extractSummaryFromResponse(response);

            return AiSummaryResponse.builder()
                    .summary(summary)
                    .componentCount(components.size())
                    .vulnerableComponentCount(componentData.size())
                    .build();

        } catch (Exception e) {
            log.error("Error generating vulnerability summary", e);
            throw new RuntimeException("Failed to generate vulnerability summary", e);
        }
    }

    private String extractSummaryFromResponse(Map<String, Object> response) {
        try {
            List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
            if (candidates != null && !candidates.isEmpty()) {
                Map<String, Object> candidate = candidates.get(0);
                Map<String, Object> content = (Map<String, Object>) candidate.get("content");
                List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                if (parts != null && !parts.isEmpty()) {
                    return (String) parts.get(0).get("text");
                }
            }
            return "No summary available";
        } catch (Exception e) {
            log.error("Error extracting summary from response", e);
            return "Error generating summary";
        }
    }

    @Override
    public String getRecommendation(Long componentId, Long vulnerabilityId) {
        ComponentVulnerability componentVulnerability = componentVulnerabilityRepository
            .findByComponentIdAndVulnerabilityId(componentId, vulnerabilityId);
        
        if (componentVulnerability == null) {
            throw new ResourceNotFoundException(
                String.format("ComponentVulnerability not found for component %d and vulnerability %d", 
                    componentId, vulnerabilityId));
        }

        if (componentVulnerability.getAiRecommendation() != null && !componentVulnerability.getAiRecommendation().isEmpty()) {
            return componentVulnerability.getAiRecommendation();
        }

        String recommendation = "This is an AI-generated recommendation for " + 
            componentVulnerability.getVulnerability().getCveId() + " in " + 
            componentVulnerability.getComponent().getName();
        componentVulnerability.setAiRecommendation(recommendation);
        componentVulnerabilityRepository.save(componentVulnerability);
        return recommendation;
    }

    @Override
    @Transactional
    public String getRemediation(Long componentId, String vulnerabilityId) {
        log.info("Getting remediation for component {} and vulnerability {}", componentId, vulnerabilityId);

        // Get component details
        Component component = componentRepository.findById(componentId)
            .orElseThrow(() -> new ResourceNotFoundException("Component not found"));

        // Get vulnerability details
        Vulnerability vulnerability = vulnerabilityRepository.findByCveId(vulnerabilityId)
            .orElseThrow(() -> new ResourceNotFoundException("Vulnerability not found"));

        // Build detailed package context
        StringBuilder packageContext = new StringBuilder();
        packageContext.append("Package Information:\n");
        packageContext.append("Name: ").append(component.getName()).append("\n");
        packageContext.append("Version: ").append(component.getVersion()).append("\n");
        packageContext.append("Type: ").append(component.getType()).append("\n");
        packageContext.append("Package URL: ").append(component.getPackageUrl()).append("\n");
        if (component.getGroupName() != null) {
            packageContext.append("Group: ").append(component.getGroupName()).append("\n");
        }
        packageContext.append("Risk Level: ").append(component.getRiskLevel()).append("\n\n");

        // Get and add dependency information
        List<DependencyEdge> dependencies = dependencyEdgeRepository.findBySourceComponentId(componentId);
        if (!dependencies.isEmpty()) {
            packageContext.append("Dependencies:\n");
            dependencies.forEach(dep -> {
                Component depComponent = dep.getTargetComponent();
                packageContext.append("- ").append(depComponent.getName())
                    .append(" (").append(depComponent.getVersion())
                    .append(", ").append(depComponent.getPackageUrl()).append(")\n");
            });
            packageContext.append("\n");
        }

        // Build vulnerability context
        StringBuilder vulnContext = new StringBuilder();
        vulnContext.append("Vulnerability Details:\n");
        vulnContext.append("CVE: ").append(vulnerability.getCveId()).append("\n");
        vulnContext.append("Severity: ").append(vulnerability.getSeverity()).append("\n");
        vulnContext.append("CVSS Score: ").append(vulnerability.getCvssScore()).append("\n");
        if (vulnerability.getCvssVector() != null) {
            vulnContext.append("CVSS Vector: ").append(vulnerability.getCvssVector()).append("\n");
        }
        vulnContext.append("Description: ").append(vulnerability.getDescription()).append("\n");
        if (vulnerability.getCwe() != null) {
            vulnContext.append("CWE: ").append(vulnerability.getCwe()).append("\n");
        }
        if (vulnerability.getRecommendation() != null) {
            vulnContext.append("Official Recommendation: ").append(vulnerability.getRecommendation()).append("\n");
        }
        vulnContext.append("\n");

        // Generate AI prompt
        String prompt = String.format(
            "You are a security expert. Analyze this vulnerable package and provide detailed remediation advice.\n\n" +
            "%s\n%s\n" +
            "Based on this information:\n" +
            "1. Analyze the vulnerability in the context of this specific package\n" +
            "2. Suggest specific version updates or patches if available\n" +
            "3. Provide alternative secure packages if appropriate\n" +
            "4. Include code examples for implementation if relevant\n" +
            "5. Consider the impact on dependencies\n\n" +
            "Structure your response as follows:\n\n" +
            "Context: [Brief analysis of the vulnerability's impact on this package]\n\n" +
            "Remediation: [Detailed step-by-step fix instructions]\n\n" +
            "Suggestion: [Alternative packages and additional security measures]",
            packageContext.toString(),
            vulnContext.toString()
        );

        try {
            // Generate content using Gemini
            GenerateContentResponse response = genAiClient.models.generateContent(
                "gemini-1.5-flash",
                prompt,
                null
            );

            String remediation = response.text();
            log.info("Generated AI remediation response for {}: {}", vulnerabilityId, remediation);

            // Save the remediation
            AiSolution solution = AiSolution.builder()
                .vulnerabilityId(vulnerabilityId)
                .componentName(component.getName())
                .componentVersion(component.getVersion())
                .context(remediation.split("Remediation:")[0].replace("Context:", "").trim())
                .remediation(remediation.split("Remediation:")[1].split("Suggestion:")[0].trim())
                .suggestion(remediation.split("Suggestion:")[1].trim())
                .severity(vulnerability.getSeverity())
                .build();
            
            aiSolutionRepository.save(solution);
            log.info("Saved AI solution with ID: {}", solution.getId());

            return remediation;
        } catch (Exception e) {
            log.error("Error generating AI remediation: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to generate AI remediation", e);
        }
    }

    @Override
    public String getFix(Long componentId, Long vulnerabilityId) {
        // Implementation for getFix, similar to above
        return "This is an AI-generated fix.";
    }

    @Override
    public List<Map<String, Object>> getProjectSolutions(Long projectId) {
        List<AiSolution> solutions = aiSolutionRepository.findAllByOrderByCreatedAtDesc();
        return solutions.stream()
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
    }

    @Override
    public String getVulnerabilitySummary(List<Vulnerability> vulnerabilities) {
        // Stub implementation
        return "This is a summary of vulnerabilities.";
    }

    @Override
    public void generateProjectSummary(Project project) {
        // Stub implementation
    }
} 