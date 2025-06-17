package com.vulnview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vulnview.dto.SBOMUploadResponse;
import com.vulnview.dto.sbom.CycloneDxBomDto;
import com.vulnview.dto.sbom.dependency.DependencyDto;
import com.vulnview.dto.sbom.component.ComponentDto;
import com.vulnview.dto.sbom.component.HashDto;
import com.vulnview.dto.sbom.component.PropertyDto;
import com.vulnview.dto.sbom.metadata.MetadataDto;
import com.vulnview.dto.sbom.vulnerability.VulnerabilityDto;
import com.vulnview.dto.sbom.vulnerability.RatingDto;
import com.vulnview.dto.sbom.service.ServiceDto;
import com.vulnview.entity.*;
import com.vulnview.repository.*;
import com.vulnview.exception.NotFoundException;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.stream.Collectors;
import java.util.regex.Pattern;

@Slf4j
@Service
@RequiredArgsConstructor
public class SBOMProcessingService {
    private final ObjectMapper objectMapper;
    private final EntityManager entityManager;
    private final SbomRepository sbomRepository;
    private final ComponentRepository componentRepository;
    private final ProjectRepository projectRepository;
    private final BuildRepository buildRepository;
    private final UserRepository userRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final ComponentVulnerabilityRepository componentVulnerabilityRepository;
    private final DependencyEdgeRepository dependencyEdgeRepository;
    private final PipelineRepository pipelineRepository;
    private final VulnerabilityScanService vulnerabilityScanService;
    private final RepositoryRepository repositoryRepository;

    private static final Map<String, Integer> VALID_SEVERITIES = Map.of(
        "critical", 4,
        "high", 3,
        "medium", 2,
        "low", 1,
        "info", 0,
        "information", 0,
        "clean", -1
    );

    private static final List<String> PREFERRED_VULNERABILITY_RATING_METHODS_ORDER = List.of(
        "CVSSv4",
        "CVSSv31",
        "CVSSv3",
        "CVSSv2",
        "OWASP",
        "SSVC",
        "other"
    );

    private static final Pattern CVE_PATTERN = Pattern.compile("^CVE-\\d{4}-\\d{4,}$");

    @Transactional
    public SBOMUploadResponse processSBOMFile(MultipartFile file, String projectName, String username, Long repositoryId) {
        try {
            log.info("Processing SBOM file for project: {} and repository: {}", projectName, repositoryId);
            
            CycloneDxBomDto bomDto;
            try (var inputStream = file.getInputStream()) {
                objectMapper.configure(com.fasterxml.jackson.core.JsonParser.Feature.AUTO_CLOSE_SOURCE, false);
                bomDto = objectMapper.readValue(inputStream, CycloneDxBomDto.class);
            }
            
            return processSBOMData(bomDto, projectName, username, repositoryId);
        } catch (IOException e) {
            log.error("Error reading SBOM file: {}", e.getMessage());
            return SBOMUploadResponse.builder()
                    .status("ERROR")
                    .message("Error reading SBOM file")
                    .errors(List.of("Could not read file contents"))
                    .build();
        }
    }

    private Map<String, String> getBomRefToNameAndVersion(CycloneDxBomDto bom) {
        Map<String, String> bomRefToName = new HashMap<>();
        Map<String, String> bomRefToVersion = new HashMap<>();

        // Process metadata component
        if (bom.getMetadata() != null && bom.getMetadata().getComponent() != null) {
            ComponentDto metaComponent = bom.getMetadata().getComponent();
            if (metaComponent.getBomRef() != null) {
                bomRefToName.put(metaComponent.getBomRef(), metaComponent.getName() != null ? metaComponent.getName() : "-");
                bomRefToVersion.put(metaComponent.getBomRef(), metaComponent.getVersion() != null ? metaComponent.getVersion() : "-");
            }
        }

        // Process components
        if (bom.getComponents() != null) {
            for (ComponentDto component : bom.getComponents()) {
                if (component.getBomRef() != null) {
                    bomRefToName.put(component.getBomRef(), component.getName() != null ? component.getName() : "-");
                    bomRefToVersion.put(component.getBomRef(), component.getVersion() != null ? component.getVersion() : "-");
                }
            }
        }

        // Process services
        if (bom.getServices() != null) {
            for (ServiceDto service : bom.getServices()) {
                if (service.getBomRef() != null) {
                    bomRefToName.put(service.getBomRef(), service.getName() != null ? service.getName() : "-");
                    bomRefToVersion.put(service.getBomRef(), service.getVersion() != null ? service.getVersion() : "-");
                }
            }
        }

        return bomRefToName;
    }

    private String getSeverityByScore(double score) {
        if (score >= 9) return "critical";
        if (score >= 7) return "high";
        if (score >= 4) return "medium";
        if (score > 0) return "low";
        return "information";
    }

    private Map<String, Object> parseVulnerabilityData(VulnerabilityDto vulnerability) {
        String vulnId = vulnerability.getId();
        String vulnSeverity = null;
        double vulnScore = 0.0;
        String vulnVector = "-";

        if (vulnerability.getRatings() != null) {
            for (RatingDto rating : vulnerability.getRatings()) {
                if (rating.getMethod() == null) continue;

                for (String preferredMethod : PREFERRED_VULNERABILITY_RATING_METHODS_ORDER) {
                    if (rating.getMethod().equals(preferredMethod)) {
                        if (rating.getSeverity() != null) {
                            String ratingSeverity = rating.getSeverity().toLowerCase();
                            if (VALID_SEVERITIES.containsKey(ratingSeverity)) {
                                if (ratingSeverity.equals("info")) {
                                    ratingSeverity = "information";
                                }
                                vulnSeverity = ratingSeverity;
                                if (rating.getScore() != null) {
                                    vulnScore = rating.getScore();
                                }
                                if (rating.getVector() != null) {
                                    vulnVector = rating.getVector();
                                }
                                break;
                            }
                        }
                        if (rating.getScore() != null) {
                            vulnSeverity = getSeverityByScore(rating.getScore());
                            vulnScore = rating.getScore();
                            if (rating.getVector() != null) {
                                vulnVector = rating.getVector();
                            }
                            break;
                        }
                    }
                }
            }
        }

        if (vulnSeverity == null) {
            if (vulnerability.getRatings() == null || vulnerability.getRatings().isEmpty()) {
                log.warn("Vulnerability with id '{}' does not have a 'ratings' field. Setting default 'INFORMATION' severity...", vulnerability.getId());
                vulnSeverity = getSeverityByScore(0);
            } else {
                for (RatingDto rating : vulnerability.getRatings()) {
                    if (rating.getSeverity() != null) {
                        String ratingSeverity = rating.getSeverity().toLowerCase();
                        if (VALID_SEVERITIES.containsKey(ratingSeverity)) {
                            vulnSeverity = ratingSeverity;
                            if (rating.getScore() != null) {
                                vulnScore = rating.getScore();
                            }
                            if (rating.getVector() != null) {
                                vulnVector = rating.getVector();
                            }
                            break;
                        }
                    }
                    if (rating.getScore() != null) {
                        vulnSeverity = getSeverityByScore(rating.getScore());
                        vulnScore = rating.getScore();
                        if (rating.getVector() != null) {
                            vulnVector = rating.getVector();
                        }
                        break;
                    }
                }
            }
        }

        if (vulnSeverity == null) {
            log.warn("Could not detect severity of vulnerability with id '{}'. Setting default 'INFORMATION' severity...", vulnerability.getId());
            vulnSeverity = getSeverityByScore(0);
        }

        Map<String, Object> result = new HashMap<>();
        result.put("id", vulnId);
        result.put("severity", vulnSeverity);
        result.put("score", vulnScore);
        result.put("vector", vulnVector);
        return result;
    }

    private Map<String, Object> parseMetadata(CycloneDxBomDto bom) {
        Map<String, Object> metadataInfo = new HashMap<>();

        if (bom.getMetadata() != null) {
            if (bom.getMetadata().getComponent() != null) {
                Map<String, String> mainComponent = new HashMap<>();
                ComponentDto component = bom.getMetadata().getComponent();
                
                if (component.getType() != null) mainComponent.put("Type", component.getType());
                if (component.getGroup() != null) mainComponent.put("Group", component.getGroup());
                if (component.getName() != null) mainComponent.put("Name", component.getName());
                if (component.getVersion() != null) mainComponent.put("Version", component.getVersion());
                if (component.getPurl() != null) mainComponent.put("PURL", component.getPurl());

                if (component.getProperties() != null) {
                    for (PropertyDto prop : component.getProperties()) {
                        String name = prop.getName();
                        if (name != null && !name.isEmpty()) {
                            String capitalizedName = name.substring(0, 1).toUpperCase() + name.substring(1);
                            mainComponent.put(capitalizedName, prop.getValue());
                        }
                    }
                }

                metadataInfo.put("Main Component", mainComponent);
            }

            if (bom.getMetadata().getTools() != null) {
                int counter = 0;
                for (var tool : bom.getMetadata().getTools()) {
                    counter++;
                    String infoId = bom.getMetadata().getTools().size() > 1 ? 
                        String.format("Tool #%d", counter) : "Tool";

                    Map<String, String> toolInfo = new HashMap<>();
                    if (tool.getVendor() != null) toolInfo.put("Vendor", tool.getVendor());
                    if (tool.getName() != null) toolInfo.put("Name", tool.getName());
                    if (tool.getVersion() != null) toolInfo.put("Version", tool.getVersion());

                    metadataInfo.put(infoId, toolInfo);
                }
            }
        }

        if (bom.getSpecVersion() != null) {
            metadataInfo.put("Spec Version", bom.getSpecVersion());
        }

        if (bom.getSerialNumber() != null) {
            metadataInfo.put("Serial Number", bom.getSerialNumber());
        }

        if (bom.getVersion() != null) {
            metadataInfo.put("Version", String.valueOf(bom.getVersion()));
        }

        return metadataInfo;
    }
    
    @Transactional
    public SBOMUploadResponse processSBOMData(CycloneDxBomDto bomDto, String projectName, String username, Long repositoryId) {
        log.info("Starting SBOM processing for project: {}, repository: {}", projectName, repositoryId);
        log.info("=== SBOM Processing Started ===");
        log.info("Processing SBOM for project: {} by user: {} with repository ID: {}", projectName, username, repositoryId);
        
        try {
            // Validate input
            if (bomDto == null) {
                log.error("SBOM data is null");
                return SBOMUploadResponse.builder()
                    .status("ERROR")
                    .message("SBOM data is null")
                    .build();
            }
            
            log.info("SBOM Format: {}", bomDto.getBomFormat());
            log.info("SBOM Version: {}", bomDto.getSpecVersion());
            
            // Get or create project
            Project project = projectRepository.findByName(projectName)
                    .orElseGet(() -> {
                    log.info("Creating new project: {}", projectName);
                        User user = userRepository.findByUsername(username)
                        .orElseThrow(() -> new RuntimeException("User not found: " + username));
                    Project newProject = Project.builder()
                        .name(projectName)
                        .ownerId(user.getId())
                        .build();
                        return projectRepository.save(newProject);
                    });
            log.info("Using project: {} (ID: {})", project.getName(), project.getId());
            
            // Get repository by ID
            Repository repository = repositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new RuntimeException("Repository not found with ID: " + repositoryId));
            log.info("Found repository: {} (ID: {})", repository.getName(), repository.getId());
            
            // Create SBOM entity
            Sbom sbom = Sbom.builder()
                .version(String.valueOf(bomDto.getVersion()))
                .bomFormat(bomDto.getBomFormat())
                .specVersion(bomDto.getSpecVersion())
                .serialNumber(bomDto.getSerialNumber())
                .commitSha("SBOM-IMPORT-" + System.currentTimeMillis())
                .build();
            
            // Store raw content
            try {
                byte[] content = objectMapper.writeValueAsBytes(bomDto);
                sbom.setContent(content);
                log.info("Stored SBOM content ({} bytes)", content.length);
            } catch (Exception e) {
                log.error("Failed to store SBOM content: {}", e.getMessage());
                return SBOMUploadResponse.builder()
                    .status("ERROR")
                    .message("Failed to store SBOM content: " + e.getMessage())
                    .build();
            }
            
            // Link to repository if provided
            if (repositoryId != null) {
                repository.addSbom(sbom);
                repositoryRepository.save(repository);
            }
            
            // Save SBOM
            sbom = sbomRepository.save(sbom);
            log.info("Saved SBOM with ID: {}", sbom.getId());
            
            // Process components
            Map<String, Component> componentMap = new HashMap<>();
            int totalComponents = 0;
            int vulnerableComponents = 0;
            if (bomDto.getComponents() != null) {
                log.info("Processing {} components", bomDto.getComponents().size());
                for (ComponentDto componentDto : bomDto.getComponents()) {
                    try {
                    Component component = createComponentFromDto(componentDto, project, sbom);
                        totalComponents++;
                        componentMap.put(componentDto.getBomRef(), component);
                        if (component.getVulnerabilities() != null && !component.getVulnerabilities().isEmpty()) {
                            vulnerableComponents++;
                        }
                    } catch (Exception e) {
                        log.error("Failed to process component {}: {}", 
                            componentDto.getName(), e.getMessage());
                    }
                }
            } else {
                log.warn("No components found in SBOM");
            }

            log.info("Processed {} components ({} vulnerable)", totalComponents, vulnerableComponents);

            // Process and save dependencies
            if (bomDto.getDependencies() != null) {
                for (DependencyDto dependencyDto : bomDto.getDependencies()) {
                    Component source = componentMap.get(dependencyDto.getRef());
                    if (source != null && dependencyDto.getDependsOn() != null) {
                        for (String targetRef : dependencyDto.getDependsOn()) {
                            Component target = componentMap.get(targetRef);
                            if (target != null) {
                                createDependencyEdge(source, target, sbom);
                            } else {
                                log.warn("Could not find target component for dependency ref: {}", targetRef);
                            }
                        }
                    } else {
                         log.warn("Could not find source component for dependency ref: {}", dependencyDto.getRef());
                    }
                }
                log.info("Processed {} dependency sets.", bomDto.getDependencies().size());
            }

            log.info("=== SBOM Processing Completed ===");
            
            return SBOMUploadResponse.builder()
                    .status("SUCCESS")
                    .sbomId(sbom.getId())
                .totalComponents(totalComponents)
                .vulnerableComponents(vulnerableComponents)
                    .build();

        } catch (Exception e) {
            log.error("=== SBOM Processing Failed ===");
            log.error("Error processing SBOM: {}", e.getMessage(), e);
            return SBOMUploadResponse.builder()
                    .status("ERROR")
                .message("Failed to process SBOM: " + e.getMessage())
                    .build();
        }
    }

    private Component createComponentFromDto(ComponentDto dto, Project project, Sbom sbom) {
        Component component = new Component();
        component.setName(dto.getName());
        component.setVersion(dto.getVersion());
        component.setType(dto.getType());
        component.setDescription(dto.getDescription());
        component.setPackageUrl(dto.getPurl());
        component.setProject(project);
        component.setSbom(sbom);
        
        // Set vendor and product names for NVD API lookup
        if (dto.getPurl() != null) {
            String[] purlParts = dto.getPurl().split("/");
            if (purlParts.length >= 2) {
                // For npm packages, use the scope as vendor if available
                if (dto.getPurl().startsWith("pkg:npm/")) {
                    String scope = purlParts[1];
                    if (scope.startsWith("@")) {
                        component.setVendor(scope.substring(1)); // Remove @ from scope
                        component.setProduct(dto.getName());
                    } else {
                        component.setVendor("npm");
                        component.setProduct(dto.getName());
                    }
                }
                // For Maven packages
                else if (dto.getPurl().startsWith("pkg:maven/")) {
                    component.setVendor(purlParts[1]);
                    component.setProduct(purlParts[2]);
                }
                // For PyPI packages
                else if (dto.getPurl().startsWith("pkg:pypi/")) {
                    component.setVendor("pypi");
                    component.setProduct(dto.getName());
                }
                // For other package types
                else {
                    component.setVendor(purlParts[1]);
                    component.setProduct(dto.getName());
                }
            }
        }
        
        // If vendor is still null, set a default based on the package type
        if (component.getVendor() == null) {
            if (dto.getPurl() != null) {
                if (dto.getPurl().startsWith("pkg:npm/")) {
                    component.setVendor("npm");
                } else if (dto.getPurl().startsWith("pkg:maven/")) {
                    component.setVendor("maven");
                } else if (dto.getPurl().startsWith("pkg:pypi/")) {
                    component.setVendor("pypi");
                } else {
                    component.setVendor("unknown");
                }
            } else {
                component.setVendor("unknown");
            }
        }
        
        // If product is still null, use the component name
        if (component.getProduct() == null) {
            component.setProduct(dto.getName());
        }
        
        return componentRepository.save(component);
    }

    private DependencyEdge createDependencyEdge(Component source, Component target, Sbom sbom) {
        DependencyEdge edge = DependencyEdge.builder()
                .sourceComponent(source)
                .targetComponent(target)
                .sbom(sbom)
                .build();
        return dependencyEdgeRepository.save(edge);
    }

    private Vulnerability createOrGetVulnerability(VulnerabilityDto dto, Project project, Map<String, Object> vulnData) {
        log.info("Processing vulnerability: id={}, severity={}, score={}", 
            dto.getId(), vulnData.get("severity"), vulnData.get("score"));
        
        try {
            // First try to find by CVE ID and project
            List<Vulnerability> existingVulns = vulnerabilityRepository.findByCveIdAndProject(dto.getId(), project);
            if (!existingVulns.isEmpty()) {
                log.info("Found existing vulnerability for CVE ID: {} in project: {}", 
                    dto.getId(), project.getName());
                return existingVulns.get(0);
            }

            // If not found in project, try to find globally
            Optional<Vulnerability> globalVuln = vulnerabilityRepository.findByCveId(dto.getId());
            if (globalVuln.isPresent()) {
                log.info("Found global vulnerability for CVE ID: {}, creating project-specific instance", 
                    dto.getId());
                Vulnerability vuln = new Vulnerability();
                vuln.setCveId(dto.getId());
                vuln.setTitle(globalVuln.get().getTitle());
                vuln.setDescription(globalVuln.get().getDescription());
                vuln.setProject(project);
                vuln.setSeverity((String) vulnData.get("severity"));
                vuln.setCvssScore(((Number) vulnData.get("score")).doubleValue());
                vuln.setCvssVector((String) vulnData.get("vector"));
                return vulnerabilityRepository.save(vuln);
            }

            // Create new vulnerability if not found
            log.info("Creating new vulnerability for CVE ID: {} in project: {}", 
                dto.getId(), project.getName());
            Vulnerability vuln = new Vulnerability();
            vuln.setCveId(dto.getId());
            vuln.setTitle(dto.getSource() != null ? dto.getSource().getName() : dto.getId());
            vuln.setDescription(dto.getDescription());
            vuln.setProject(project);
            vuln.setSeverity((String) vulnData.get("severity"));
            vuln.setCvssScore(((Number) vulnData.get("score")).doubleValue());
            vuln.setCvssVector((String) vulnData.get("vector"));
            return vulnerabilityRepository.save(vuln);
        } catch (Exception e) {
            log.error("Error processing vulnerability {}: {}", dto.getId(), e.getMessage(), e);
            throw e;
        }
    }

    @Transactional
    public CycloneDxBomDto getSBOMForProject(Long projectId) {
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new IllegalArgumentException("Project not found: " + projectId));
                
        Sbom latestSbom = sbomRepository.findFirstByBuild_ProjectOrderByCreatedAtDesc(project)
                .orElseThrow(() -> new IllegalArgumentException("No SBOM found for project: " + projectId));
                
        return CycloneDxBomDto.builder()
                .bomFormat("CycloneDX")
                .specVersion("1.4")
                .serialNumber(latestSbom.getId().toString())
                .version(1)
                .metadata(MetadataDto.builder()
                        .component(ComponentDto.builder()
                                .name(project.getName())
                                .type("application")
                                .build())
                        .build())
                .components(latestSbom.getComponents().stream()
                        .map(this::mapComponentToDto)
                        .collect(Collectors.toList()))
                .build();
    }
    
    private ComponentDto mapComponentToDto(Component component) {
        return ComponentDto.builder()
                .name(component.getName())
                .version(component.getVersion())
                .type(component.getType())
                .purl(component.getPackageUrl())
                .build();
    }

    /**
     * Helper method to recursively collect all dependencies of a component
     * 
     * @param componentId The component ID to find dependencies for
     * @param visited Set of already visited component IDs
     * @param dependencyGraph Map of component ID to its direct dependencies
     */
    private void collectAllDependencies(Long componentId, Set<Long> visited, Map<Long, Set<Long>> dependencyGraph) {
        if (visited.contains(componentId)) {
            return; // Prevent cycles
        }
        
        visited.add(componentId);
        Set<Long> dependencies = dependencyGraph.getOrDefault(componentId, Collections.emptySet());
        
        for (Long dependencyId : new HashSet<>(dependencies)) {
            collectAllDependencies(dependencyId, visited, dependencyGraph);
        }
    }

    @Transactional
    public void processSBOMData(JsonNode sbomData, Sbom sbom) {
        try {
            JsonNode components = sbomData.path("components");
            if (components.isMissingNode() || !components.isArray()) {
                throw new IllegalArgumentException("Invalid SBOM format: components array not found");
            }

            Map<String, Component> componentMap = new HashMap<>();
            Set<DependencyEdge> edges = new HashSet<>();

            // First pass: Create all components
            for (JsonNode componentNode : components) {
                Component component = createComponentFromNode(componentNode, sbom);
                componentMap.put(component.getPackageUrl(), component);
            }

            // Second pass: Process dependencies
            for (JsonNode componentNode : components) {
                String purl = componentNode.path("purl").asText();
                Component source = componentMap.get(purl);
                if (source == null) continue;

                JsonNode dependencies = componentNode.path("dependencies");
                if (dependencies.isArray()) {
                    for (JsonNode depNode : dependencies) {
                        String depPurl = depNode.asText();
                        Component target = componentMap.get(depPurl);
                        if (target != null) {
                            // Create the dependency edge
                            DependencyEdge edge = DependencyEdge.builder()
                                .sourceComponent(source)
                                .targetComponent(target)
                                .sbom(sbom)
                                .build();
                            
                            // Add to source's outgoing dependencies
                            source.getOutgoingDependencies().add(edge);
                            
                            // Add to target's incoming dependencies
                            target.getIncomingDependencies().add(edge);
                            
                            edges.add(edge);
                        }
                    }
                }
            }

            // Save all edges
            dependencyEdgeRepository.saveAll(edges);

            // Process vulnerabilities
            processVulnerabilities(sbomData, componentMap, sbom);

        } catch (Exception e) {
            log.error("Error processing SBOM data", e);
            throw new RuntimeException("Failed to process SBOM data: " + e.getMessage());
        }
    }

    private Component createComponentFromNode(JsonNode node, Sbom sbom) {
        String purl = node.path("purl").asText();
        if (purl.isEmpty()) {
            throw new IllegalArgumentException("Component PURL is required");
        }

        Component component = Component.builder()
            .name(node.path("name").asText())
            .version(node.path("version").asText())
            .groupName(node.path("group").asText())
            .type(node.path("type").asText())
            .description(node.path("description").asText())
            .packageUrl(purl)
            .hash(node.path("hashes").path("SHA-256").asText())
            .evidence(node.path("evidence").toString())
            .sbom(sbom)
            .build();

        return componentRepository.save(component);
    }

    private void processVulnerabilities(JsonNode sbomData, Map<String, Component> componentMap, Sbom sbom) {
        JsonNode vulnerabilities = sbomData.path("vulnerabilities");
        if (vulnerabilities.isMissingNode() || !vulnerabilities.isArray()) {
            return;
        }

        for (JsonNode vulnNode : vulnerabilities) {
            String vulnId = vulnNode.path("id").asText();
            if (vulnId.isEmpty()) continue;

            // Create vulnerability data map
            Map<String, Object> vulnData = new HashMap<>();
            vulnData.put("id", vulnId);
            vulnData.put("severity", vulnNode.path("ratings").path(0).path("severity").asText().toLowerCase());
            vulnData.put("score", vulnNode.path("ratings").path(0).path("score").asDouble());
            vulnData.put("vector", vulnNode.path("ratings").path(0).path("vector").asText());

            // Create vulnerability DTO
            VulnerabilityDto vulnDto = new VulnerabilityDto();
            vulnDto.setId(vulnId);
            vulnDto.setDescription(vulnNode.path("description").asText());
            vulnDto.setSource(new com.vulnview.dto.sbom.vulnerability.SourceDto(
                vulnNode.path("source").path("name").asText(),
                vulnNode.path("source").path("url").asText()
            ));

            // Create affected components list
            List<com.vulnview.dto.sbom.vulnerability.AffectsDto> affects = new ArrayList<>();
            JsonNode affectedComponents = vulnNode.path("affected");
            if (affectedComponents.isArray()) {
                for (JsonNode affectedNode : affectedComponents) {
                    String ref = affectedNode.path("ref").asText();
                    if (!ref.isEmpty()) {
                        com.vulnview.dto.sbom.vulnerability.AffectsDto affect = new com.vulnview.dto.sbom.vulnerability.AffectsDto();
                        affect.setRef(ref);
                        affects.add(affect);
                    }
                }
            }
            vulnDto.setAffects(affects);

            try {
                Vulnerability vulnerability = createOrGetVulnerability(vulnDto, sbom.getBuild().getProject(), vulnData);
                
                // Link vulnerability to affected components
                for (com.vulnview.dto.sbom.vulnerability.AffectsDto affect : affects) {
                    Component component = componentMap.get(affect.getRef());
                    if (component != null) {
                        ComponentVulnerability cv = new ComponentVulnerability();
                        cv.setComponent(component);
                        cv.setVulnerability(vulnerability);
                        cv.setSbom(sbom);
                        componentVulnerabilityRepository.save(cv);
                    }
                }
            } catch (Exception e) {
                log.error("Error processing vulnerability {}: {}", vulnId, e.getMessage(), e);
            }
        }
    }

    private Component createPlaceholderComponent(String bomRef, Project project, Sbom sbom) {
        Component component = new Component();
        component.setName(bomRef);
        component.setVersion("-");
        component.setType("unknown");
        component.setProject(project);
        component.setSbom(sbom);
        return componentRepository.save(component);
    }

    @Transactional
    public CycloneDxBomDto getSBOMById(Long id) {
        Sbom sbom = sbomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("SBOM not found with id: " + id));
                
        try {
            return objectMapper.readValue(sbom.getContent(), CycloneDxBomDto.class);
        } catch (IOException e) {
            log.error("Error parsing SBOM content: {}", e.getMessage());
            throw new RuntimeException("Failed to parse SBOM content", e);
        }
    }

    private Sbom parseAndSaveSBOM(MultipartFile file) throws IOException {
        try {
            // Use the existing processSBOMFile method which already handles parsing
            SBOMUploadResponse response = processSBOMFile(file, "temp-project", "system", null);
            if (!"SUCCESS".equals(response.getStatus())) {
                throw new IOException("Failed to process SBOM: " + response.getMessage());
            }
            
            // Get the SBOM from the response
            return sbomRepository.findById(response.getSbomId())
                .orElseThrow(() -> new IOException("Failed to find saved SBOM"));
        } catch (Exception e) {
            log.error("Error parsing and saving SBOM: {}", e.getMessage());
            throw new IOException("Failed to parse and save SBOM", e);
        }
    }

    private Project createProjectFromSBOM(Sbom sbom, User user) {
        Project newProject = new Project();
        newProject.setName(sbom.getRepository().getName());
        newProject.setDescription("Project created from SBOM: " + sbom.getVersion());
        newProject.setOwnerId(user.getId());
        return projectRepository.save(newProject);
    }

    public SBOMUploadResponse processSBOM(MultipartFile file, String projectName) {
        try {
            // Use the existing processSBOMFile method which already handles parsing
            return processSBOMFile(file, projectName, "system", null); // Using "system" as default username
        } catch (Exception e) {
            log.error("Error processing SBOM data: {}", e.getMessage(), e);
            return SBOMUploadResponse.builder()
                    .status("ERROR")
                    .message("Error processing SBOM data")
                    .errors(List.of(e.getMessage()))
                    .build();
        }
    }

    public void processSBOM(Long projectId, String sbomContent) {
        // Implementation of processSBOM method
    }

    private void processDependencies(Component component, Set<Component> processedComponents, Sbom sbom) {
        if (processedComponents.contains(component)) {
            return;
        }
        processedComponents.add(component);

        component.getDependencies().forEach(dependency -> {
            DependencyEdge edge = DependencyEdge.builder()
                    .sourceComponent(component)
                    .targetComponent(dependency)
                    .sbom(sbom)
                    .build();
            dependencyEdgeRepository.save(edge);
            processDependencies(dependency, processedComponents, sbom);
        });
    }

    private List<ComponentDto> filterAndLimitComponents(List<ComponentDto> components) {
        if (components == null || components.isEmpty()) {
            return new ArrayList<>();
        }

        // Sort components by type priority and dependencies
        return components.stream()
            .filter(comp -> comp != null && (comp.getName() != null || comp.getPurl() != null))
            .sorted((c1, c2) -> {
                // Prioritize application and library components
                int typePriority1 = getTypePriority(c1.getType());
                int typePriority2 = getTypePriority(c2.getType());
                if (typePriority1 != typePriority2) {
                    return typePriority2 - typePriority1;
                }
                return c1.getName() != null && c2.getName() != null ? c1.getName().compareTo(c2.getName()) : 0;
            })
            .collect(Collectors.toList());
    }

    private int getTypePriority(String type) {
        if (type == null) return 0;
        switch (type.toLowerCase()) {
            case "application":
                return 3;
            case "library":
                return 2;
            case "framework":
                return 1;
            default:
                return 0;
        }
    }
}