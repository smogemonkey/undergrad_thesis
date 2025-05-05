package com.vulnview.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import com.vulnview.dto.sbom.SBOMUploadResponse;
import com.vulnview.dto.sbom.SbomDto;
import com.vulnview.entity.Build;
import com.vulnview.entity.Component;
import com.vulnview.entity.DependencyEdge;
import com.vulnview.entity.Pipeline;
import com.vulnview.entity.Project;
import com.vulnview.entity.RiskLevel;
import com.vulnview.entity.Sbom;
import com.vulnview.entity.User;
import com.vulnview.repository.BuildRepository;
import com.vulnview.repository.ComponentRepository;
import com.vulnview.repository.DependencyEdgeRepository;
import com.vulnview.repository.PipelineRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.repository.SbomRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.cyclonedx.BomParserFactory;
import org.cyclonedx.model.Bom;
import org.cyclonedx.parsers.Parser;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class SBOMProcessingService {
    private final ProjectRepository projectRepository;
    private final ComponentRepository componentRepository;
    private final SbomRepository sbomRepository;
    private final DependencyEdgeRepository dependencyEdgeRepository;
    private final BuildRepository buildRepository;
    private final PipelineRepository pipelineRepository;
    private final UserService userService;

    @Transactional
    public SBOMUploadResponse processSBOMFile(MultipartFile file, String projectName) {
        log.info("Starting to process SBOM file for project: {}", projectName);
        log.info("File details - name: {}, size: {} bytes, content type: {}", 
                file.getOriginalFilename(), file.getSize(), file.getContentType());

        try {
            byte[] bytes = file.getBytes();
            log.info("Read {} bytes from file", bytes.length);

            // Parse the JSON manually first
            ObjectMapper mapper = new ObjectMapper();
            JsonNode rootNode = mapper.readTree(bytes);
            log.info("Parsed SBOM JSON structure: {}", rootNode.toString());
            
            // Validate required fields
            if (!rootNode.has("bomFormat") || !rootNode.get("bomFormat").asText().equals("CycloneDX")) {
                throw new IllegalArgumentException("Invalid BOM format. Only CycloneDX format is supported");
            }

            if (!rootNode.has("specVersion")) {
                throw new IllegalArgumentException("Missing specVersion field");
            }

            // Create SBOM entity
            Sbom sbom = new Sbom();
            sbom.setBomFormat(rootNode.get("bomFormat").asText());
            sbom.setSpecVersion(rootNode.get("specVersion").asText());
            sbom.setVersion(rootNode.has("version") ? rootNode.get("version").asText() : "1");
            sbom.setContent(rootNode.toString());
            
            if (rootNode.has("metadata") && rootNode.get("metadata").has("timestamp")) {
                sbom.setTimestamp(rootNode.get("metadata").get("timestamp").asText());
            }
            log.info("Created SBOM entity: {}", sbom);

            User currentUser = userService.getCurrentUser();
            log.info("Retrieved current user: {}", currentUser.getUsername());
            
            Project project = createOrUpdateProject(rootNode, projectName, currentUser);
            log.info("Created/Updated project: {}", project);
            
            // Create a new build
            Build build = createBuild(projectName, project);
            log.info("Created build: {}", build);
            
            sbom.setBuild(build);
            log.info("Saving SBOM entity to database: {}", sbom);
            sbom = sbomRepository.save(sbom);
            log.info("Saved SBOM with ID: {}", sbom.getId());

            // Process components and dependencies
            log.info("Starting to process components from JSON");
            Set<Component> components = processComponentsFromJson(rootNode, sbom);
            log.info("Processed {} components", components.size());
            
            project.setComponents(components);
            log.info("Updating project with components: {}", project);
            project = projectRepository.save(project);
            log.info("Updated project with ID: {}", project.getId());

            return createUploadResponse(project, components);
        } catch (Exception e) {
            log.error("Error processing SBOM file", e);
            return SBOMUploadResponse.builder()
                    .status("ERROR")
                    .message("Failed to process SBOM file: " + e.getMessage())
                    .errors(List.of(e.getMessage()))
                    .build();
        }
    }

    @Transactional
    public SBOMUploadResponse processSBOMData(SbomDto sbomDto, String projectName) {
        try {
            // Validate BOM format and version
            if (!sbomDto.getBomFormat().equals("CycloneDX")) {
                throw new IllegalArgumentException("Invalid BOM format. Only CycloneDX format is supported");
            }

            User currentUser = userService.getCurrentUser();
            Project project = createOrUpdateProjectFromDto(sbomDto, projectName, currentUser);
            
            // Create a new build
            Build build = createBuild(projectName, project);
            
            // Create and save SBOM
            Sbom sbom = createSbomFromDto(sbomDto);
            sbom.setBuild(build);
            sbomRepository.save(sbom);

            // Process components and dependencies
            Set<Component> components = processComponentsFromDto(sbomDto.getComponents(), sbomDto.getDependencies(), sbom);
            project.setComponents(components);
            projectRepository.save(project);

            return createUploadResponse(project, components);
        } catch (Exception e) {
            log.error("Error processing SBOM data", e);
            return SBOMUploadResponse.builder()
                    .status("ERROR")
                    .message("Failed to process SBOM data: " + e.getMessage())
                    .errors(List.of(e.getMessage()))
                    .build();
        }
    }

    private Build createBuild(String projectName, Project project) {
        log.info("Creating build for project: {}", projectName);
        
        // Save project first
        project = projectRepository.save(project);
        log.info("Saved project with ID: {}", project.getId());
        
        // Create or get default pipeline
        Pipeline pipeline = pipelineRepository.findByNameAndProjectName("default", projectName);
        if (pipeline == null) {
            log.info("Creating new default pipeline for project: {}", projectName);
            pipeline = new Pipeline();
            pipeline.setName("default");
            pipeline.setProject(project);
            pipeline = pipelineRepository.save(pipeline);
            log.info("Created pipeline with ID: {}", pipeline.getId());
        } else {
            log.info("Found existing pipeline with ID: {}", pipeline.getId());
        }
        
        // Create new build
        Build build = new Build();
        build.setRepository(projectName);
        build.setBranch("main");
        build.setBuildNumber(1); // You might want to increment this based on existing builds
        build.setResult("SUCCESS");
        build.setDuration(0);
        build.setStartAt(LocalDateTime.now());
        build.setPipeline(pipeline);
        
        build = buildRepository.save(build);
        log.info("Created build with ID: {}", build.getId());
        
        return build;
    }

    private Sbom createSbom(Bom bom, String filename) {
        Sbom sbom = new Sbom();
        sbom.setBomFormat(bom.getBomFormat());
        sbom.setSpecVersion(bom.getSpecVersion());
        sbom.setVersion(String.valueOf(bom.getVersion()));
        sbom.setTimestamp(bom.getMetadata() != null ? 
            bom.getMetadata().getTimestamp().toString() : null);
        sbom.setContent(bom.toString()); // Use toString() instead of toJson()
        return sbom;
    }

    private Sbom createSbomFromDto(SbomDto sbomDto) {
        Sbom sbom = new Sbom();
        sbom.setBomFormat(sbomDto.getBomFormat());
        sbom.setSpecVersion(sbomDto.getSpecVersion());
        sbom.setVersion(String.valueOf(sbomDto.getVersion()));
        sbom.setTimestamp(sbomDto.getMetadata() != null ? 
            sbomDto.getMetadata().getTimestamp() : null);
        sbom.setContent(sbomDto.toString());
        return sbom;
    }

    private Project createOrUpdateProject(JsonNode rootNode, String projectName, User currentUser) {
        Optional<Project> existingProject = projectRepository.findByNameAndOwner(projectName, currentUser);
        
        Project project;
        if (existingProject.isPresent()) {
            project = existingProject.get();
            project.setUpdatedAt(LocalDateTime.now());
        } else {
            project = Project.builder()
                    .name(projectName)
                    .owner(currentUser)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
        }

        if (rootNode.has("metadata")) {
            JsonNode metadata = rootNode.get("metadata");
            if (metadata.has("component")) {
                JsonNode component = metadata.get("component");
                if (component.has("version")) {
                    project.setVersion(component.get("version").asText());
                }
            }
        }

        return projectRepository.save(project);
    }

    private Project createOrUpdateProjectFromDto(SbomDto sbomDto, String projectName, User currentUser) {
        Optional<Project> existingProject = projectRepository.findByNameAndOwnerId(projectName, currentUser.getId());
        
        Project project;
        if (existingProject.isPresent()) {
            project = existingProject.get();
            project.setUpdatedAt(LocalDateTime.now());
        } else {
            project = new Project();
            project.setName(projectName);
            project.setOwner(currentUser);
            project.setCreatedAt(LocalDateTime.now());
            project.setUpdatedAt(LocalDateTime.now());
        }

        if (sbomDto.getMetadata() != null && sbomDto.getMetadata().getComponent() != null) {
            project.setVersion(sbomDto.getMetadata().getComponent().getVersion());
        }

        return project;
    }

    private Project createOrUpdateProjectFromJson(JsonNode rootNode, String projectName, User currentUser) {
        log.info("Creating/Updating project from JSON for project name: {} and user: {}", projectName, currentUser.getUsername());
        
        Optional<Project> existingProject = projectRepository.findByNameAndOwnerId(projectName, currentUser.getId());
        log.info("Existing project found: {}", existingProject.isPresent());
        
        Project project;
        if (existingProject.isPresent()) {
            project = existingProject.get();
            project.setUpdatedAt(LocalDateTime.now());
            log.info("Updating existing project: {}", project);
        } else {
            project = new Project();
            project.setName(projectName);
            project.setOwner(currentUser);
            project.setCreatedAt(LocalDateTime.now());
            project.setUpdatedAt(LocalDateTime.now());
            log.info("Creating new project: {}", project);
        }

        if (rootNode.has("metadata") && rootNode.get("metadata").has("component") && 
            rootNode.get("metadata").get("component").has("version")) {
            String version = rootNode.get("metadata").get("component").get("version").asText();
            project.setVersion(version);
            log.info("Set project version to: {}", version);
        }

        log.info("Saving project to database: {}", project);
        project = projectRepository.save(project);
        log.info("Saved project with ID: {}", project.getId());

        return project;
    }

    private Set<Component> processComponents(List<org.cyclonedx.model.Component> bomComponents, 
                                           List<org.cyclonedx.model.Dependency> dependencies,
                                           Sbom sbom) {
        Set<Component> components = new HashSet<>();
        Map<String, Component> componentMap = new HashMap<>();

        try {
        // Process all components first
        for (org.cyclonedx.model.Component bomComponent : bomComponents) {
                try {
            Component component = createOrUpdateComponent(bomComponent);
            component.setSbom(sbom);
                    component.setProject(sbom.getBuild().getPipeline().getProject());
                    component = componentRepository.save(component);
            components.add(component);
                    if (bomComponent.getPurl() != null) {
            componentMap.put(bomComponent.getPurl(), component);
                    }
                } catch (Exception e) {
                    log.error("Error processing component: {}", bomComponent.getName(), e);
                    // Continue processing other components
                }
        }

        // Process dependencies and create edges
        if (dependencies != null) {
            for (org.cyclonedx.model.Dependency dependency : dependencies) {
                    try {
                String ref = dependency.getRef();
                Component sourceComponent = componentMap.get(ref);
                        if (sourceComponent != null && dependency.getDependencies() != null) {
                    for (org.cyclonedx.model.Dependency dep : dependency.getDependencies()) {
                        Component targetComponent = componentMap.get(dep.getRef());
                        if (targetComponent != null) {
                            // Create dependency edge
                            DependencyEdge edge = new DependencyEdge();
                            edge.setSbom(sbom);
                            edge.setSourceComponent(sourceComponent);
                            edge.setTargetComponent(targetComponent);
                            edge.setDependencyType("DIRECT");
                            dependencyEdgeRepository.save(edge);
                        }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error processing dependency for ref: {}", dependency.getRef(), e);
                        // Continue processing other dependencies
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in processComponents", e);
            throw new RuntimeException("Failed to process components: " + e.getMessage(), e);
        }

        return components;
    }

    private Set<Component> processComponentsFromDto(List<com.vulnview.dto.sbom.component.ComponentDto> components,
                                                  List<com.vulnview.dto.sbom.dependency.DependencyDto> dependencies,
                                                  Sbom sbom) {
        Set<Component> resultComponents = new HashSet<>();
        Map<String, Component> componentMap = new HashMap<>();

        try {
            // Process all components first
            for (com.vulnview.dto.sbom.component.ComponentDto componentDto : components) {
                try {
                    Component component = createOrUpdateComponentFromDto(componentDto);
                    component.setSbom(sbom);
                    component.setProject(sbom.getBuild().getPipeline().getProject());
                    component = componentRepository.save(component);
                    resultComponents.add(component);
                    if (componentDto.getPurl() != null) {
                        componentMap.put(componentDto.getPurl(), component);
                    }
                } catch (Exception e) {
                    log.error("Error processing component: {}", componentDto.getName(), e);
                    // Continue processing other components
                }
            }

            // Process dependencies and create edges
            if (dependencies != null) {
                for (com.vulnview.dto.sbom.dependency.DependencyDto dependency : dependencies) {
                    try {
                        String ref = dependency.getRef();
                        Component sourceComponent = componentMap.get(ref);
                        if (sourceComponent != null && dependency.getDependsOn() != null) {
                            for (String depRef : dependency.getDependsOn()) {
                                Component targetComponent = componentMap.get(depRef);
                                if (targetComponent != null) {
                                    // Create dependency edge
                                    DependencyEdge edge = new DependencyEdge();
                                    edge.setSbom(sbom);
                                    edge.setSourceComponent(sourceComponent);
                                    edge.setTargetComponent(targetComponent);
                                    edge.setDependencyType("DIRECT");
                                    dependencyEdgeRepository.save(edge);
                                }
                            }
                        }
                    } catch (Exception e) {
                        log.error("Error processing dependency for ref: {}", dependency.getRef(), e);
                        // Continue processing other dependencies
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in processComponentsFromDto", e);
            throw new RuntimeException("Failed to process components from DTO: " + e.getMessage(), e);
        }

        return resultComponents;
    }

    private Component createOrUpdateComponent(org.cyclonedx.model.Component bomComponent) {
        String name = bomComponent.getName();
        String group = bomComponent.getGroup();
        String version = bomComponent.getVersion();
        String purl = bomComponent.getPurl();

        Optional<Component> existingComponent = componentRepository.findByNameAndGroupAndVersion(
                name, group, version);

        if (existingComponent.isPresent()) {
            Component component = existingComponent.get();
            // Update any fields that might have changed
            component.setPackageUrl(purl);
            component.setLicense(extractLicense(bomComponent));
            return component;
        }

        Component component = Component.builder()
                .name(name)
                .group(group)
                .version(version)
                .packageUrl(purl)
                .license(extractLicense(bomComponent))
                .riskLevel(RiskLevel.NONE)
                .dependencies(new HashSet<>())
                .vulnerabilities(new HashSet<>())
                .build();

        return component;
    }

    private Component createOrUpdateComponentFromDto(com.vulnview.dto.sbom.component.ComponentDto componentDto) {
        String name = componentDto.getName();
        String group = componentDto.getGroup();
        String version = componentDto.getVersion();

        Optional<Component> existingComponent = componentRepository.findByNameAndGroupAndVersion(
                name, group, version);

        if (existingComponent.isPresent()) {
            return existingComponent.get();
        }

        Component component = Component.builder()
                .name(name)
                .group(group)
                .version(version)
                .packageUrl(componentDto.getPurl())
                .license(componentDto.getLicenses() != null && !componentDto.getLicenses().isEmpty() ? 
                        componentDto.getLicenses().get(0) : null)
                .riskLevel(RiskLevel.NONE)
                .dependencies(new HashSet<>())
                .vulnerabilities(new HashSet<>())
                .build();

        return component;
    }

    private String extractLicense(org.cyclonedx.model.Component bomComponent) {
        if (bomComponent.getLicenseChoice() != null && 
            bomComponent.getLicenseChoice().getLicenses() != null && 
            !bomComponent.getLicenseChoice().getLicenses().isEmpty()) {
            return bomComponent.getLicenseChoice().getLicenses().get(0).getId();
        }
        return null;
    }

    private SBOMUploadResponse createUploadResponse(Project project, Set<Component> components) {
        int vulnerableCount = (int) components.stream()
                .filter(c -> !c.getVulnerabilities().isEmpty())
                .count();

        return SBOMUploadResponse.builder()
                .projectName(project.getName())
                .projectVersion(project.getVersion())
                .totalComponents(components.size())
                .vulnerableComponents(vulnerableCount)
                .processedFiles(List.of(project.getName()))
                .errors(Collections.emptyList())
                .status("SUCCESS")
                .message("SBOM processed successfully")
                .build();
    }

    private Set<Component> processComponentsFromJson(JsonNode rootNode, Sbom sbom) {
        log.info("Processing components from JSON for SBOM: {}", sbom.getId());
        Set<Component> components = new HashSet<>();
        Map<String, Component> componentMap = new HashMap<>();

        try {
            // Process all components
            JsonNode componentsNode = rootNode.get("components");
            log.info("Found {} components in JSON", componentsNode.size());
            
            if (componentsNode.isArray()) {
                for (JsonNode componentNode : componentsNode) {
                    try {
                        log.info("Processing component: {}", componentNode);
                        Component component = createOrUpdateComponentFromJson(componentNode);
                        component.setSbom(sbom);
                        component.setProject(sbom.getBuild().getPipeline().getProject());
                        log.info("Saving component to database: {}", component);
                        component = componentRepository.save(component);
                        log.info("Saved component with ID: {}", component.getId());
                        
                        components.add(component);
                        String bomRef = componentNode.has("bom-ref") ? 
                            componentNode.get("bom-ref").asText() : 
                            componentNode.has("purl") ? componentNode.get("purl").asText() : null;
                            
                        if (bomRef != null) {
                            componentMap.put(bomRef, component);
                            log.info("Mapped component {} to ref: {}", component.getId(), bomRef);
                        }
                    } catch (Exception e) {
                        log.error("Error processing component: {}", componentNode.get("name"), e);
                        // Continue processing other components
                    }
                }
            }

            // Process dependencies
            if (rootNode.has("dependencies")) {
                JsonNode dependenciesNode = rootNode.get("dependencies");
                log.info("Found {} dependencies in JSON", dependenciesNode.size());
                
                if (dependenciesNode.isArray()) {
                    for (JsonNode dependencyNode : dependenciesNode) {
                        try {
                            log.info("Processing dependency: {}", dependencyNode);
                            if (dependencyNode.has("ref")) {
                                String ref = dependencyNode.get("ref").asText();
                                Component sourceComponent = componentMap.get(ref);
                                log.info("Found source component for ref {}: {}", ref, sourceComponent != null);
                                
                                if (sourceComponent != null && dependencyNode.has("dependsOn")) {
                                    JsonNode dependsOnNode = dependencyNode.get("dependsOn");
                                    if (dependsOnNode.isArray()) {
                                        for (JsonNode depNode : dependsOnNode) {
                                            String targetRef = depNode.asText();
                                            Component targetComponent = componentMap.get(targetRef);
                                            log.info("Found target component for ref {}: {}", targetRef, targetComponent != null);
                                            
                                            if (targetComponent != null) {
                                                // Create dependency edge
                                                DependencyEdge edge = new DependencyEdge();
                                                edge.setSbom(sbom);
                                                edge.setSourceComponent(sourceComponent);
                                                edge.setTargetComponent(targetComponent);
                                                edge.setDependencyType("DIRECT");
                                                log.info("Saving dependency edge: {}", edge);
                                                edge = dependencyEdgeRepository.save(edge);
                                                log.info("Saved dependency edge with ID: {}", edge.getId());
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (Exception e) {
                            log.error("Error processing dependency", e);
                            // Continue processing other dependencies
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error in processComponentsFromJson", e);
            throw new RuntimeException("Failed to process components from JSON: " + e.getMessage(), e);
        }

        return components;
    }

    private Component createOrUpdateComponentFromJson(JsonNode componentNode) {
        String name = componentNode.has("name") ? componentNode.get("name").asText() : null;
        String group = componentNode.has("group") ? componentNode.get("group").asText() : "";
        String version = componentNode.has("version") ? componentNode.get("version").asText() : null;
        String purl = componentNode.has("purl") ? componentNode.get("purl").asText() : null;
        String type = componentNode.has("type") ? componentNode.get("type").asText() : "library";
        String description = componentNode.has("description") ? componentNode.get("description").asText() : null;
        String scope = componentNode.has("scope") ? componentNode.get("scope").asText() : null;

        if (name == null || version == null) {
            throw new IllegalArgumentException("Component must have a name and version");
        }

        Optional<Component> existingComponent = componentRepository.findByNameAndGroupAndVersion(
                name, group, version);

        Component component;
        if (existingComponent.isPresent()) {
            component = existingComponent.get();
            // Update any fields that might have changed
            component.setPackageUrl(purl);
            component.setType(type);
            component.setDescription(description);
            if (componentNode.has("hashes")) {
                JsonNode hashes = componentNode.get("hashes");
                if (hashes.isArray() && hashes.size() > 0) {
                    JsonNode firstHash = hashes.get(0);
                    if (firstHash.has("alg") && firstHash.has("content")) {
                        String hashAlg = firstHash.get("alg").asText();
                        String hashContent = firstHash.get("content").asText();
                        component.setHash(hashAlg + ":" + hashContent);
                    }
                }
            }
            if (componentNode.has("evidence")) {
                JsonNode evidence = componentNode.get("evidence");
                if (evidence.has("identity")) {
                    JsonNode identity = evidence.get("identity");
                    if (identity.isArray() && identity.size() > 0) {
                        JsonNode firstIdentity = identity.get(0);
                        if (firstIdentity.has("field") && firstIdentity.has("confidence")) {
                            String field = firstIdentity.get("field").asText();
                            double confidence = firstIdentity.get("confidence").asDouble();
                            component.setEvidence(field + ":" + confidence);
                        }
                    }
                }
            }
        } else {
            component = Component.builder()
                    .name(name)
                    .group(group)
                    .version(version)
                    .packageUrl(purl)
                    .type(type)
                    .description(description)
                    .riskLevel(RiskLevel.NONE)
                    .dependencies(new HashSet<>())
                    .vulnerabilities(new HashSet<>())
                    .build();

            if (componentNode.has("hashes")) {
                JsonNode hashes = componentNode.get("hashes");
                if (hashes.isArray() && hashes.size() > 0) {
                    JsonNode firstHash = hashes.get(0);
                    if (firstHash.has("alg") && firstHash.has("content")) {
                        String hashAlg = firstHash.get("alg").asText();
                        String hashContent = firstHash.get("content").asText();
                        component.setHash(hashAlg + ":" + hashContent);
                    }
                }
            }
            if (componentNode.has("evidence")) {
                JsonNode evidence = componentNode.get("evidence");
                if (evidence.has("identity")) {
                    JsonNode identity = evidence.get("identity");
                    if (identity.isArray() && identity.size() > 0) {
                        JsonNode firstIdentity = identity.get(0);
                        if (firstIdentity.has("field") && firstIdentity.has("confidence")) {
                            String field = firstIdentity.get("field").asText();
                            double confidence = firstIdentity.get("confidence").asDouble();
                            component.setEvidence(field + ":" + confidence);
                        }
                    }
                }
            }
        }

        return component;
    }
}