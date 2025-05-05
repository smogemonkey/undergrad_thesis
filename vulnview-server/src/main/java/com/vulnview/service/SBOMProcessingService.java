package com.vulnview.service;

import com.vulnview.dto.sbom.SBOMUploadResponse;
import com.vulnview.entity.Component;
import com.vulnview.entity.Project;
import com.vulnview.entity.RiskLevel;
import com.vulnview.entity.User;
import com.vulnview.repository.ComponentRepository;
import com.vulnview.repository.ProjectRepository;
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
    private final UserService userService;

    @Transactional
    public SBOMUploadResponse processSBOMFile(MultipartFile file, String projectName) {
        try {
            InputStream inputStream = file.getInputStream();
            byte[] bytes = inputStream.readAllBytes();
            Parser parser = BomParserFactory.createParser(bytes);
            Bom bom = parser.parse(bytes);

            User currentUser = userService.getCurrentUser();

            Project project = createOrUpdateProject(bom, projectName, currentUser);
            Set<Component> components = processComponents(bom.getComponents());
            project.setComponents(components);
            projectRepository.save(project);

            return createUploadResponse(project, components);
        } catch (IOException e) {
            log.error("Error processing SBOM file", e);
            throw new IllegalArgumentException("Failed to process SBOM file: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error parsing SBOM file", e);
            throw new IllegalArgumentException("Failed to parse SBOM file: " + e.getMessage());
        }
    }

    private Project createOrUpdateProject(Bom bom, String projectName, User owner) {
        String version = String.valueOf(bom.getVersion());
        if (version == null || version.equals("null")) {
            version = "1.0.0";
        }
        
        Optional<Project> existingProject = projectRepository.findByNameAndOwner(projectName, owner);
        
        if (existingProject.isPresent()) {
            Project project = existingProject.get();
            project.setVersion(version);
            project.getComponents().clear(); // Clear existing components
            return project;
        }

        Project project = Project.builder()
                .name(projectName)
                .version(version)
                .owner(owner)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .components(new HashSet<>())
                .build();

        return project;
    }

    private Set<Component> processComponents(List<org.cyclonedx.model.Component> bomComponents) {
        Set<Component> components = new HashSet<>();
        if (bomComponents == null) return components;

        for (org.cyclonedx.model.Component bomComponent : bomComponents) {
            Component component = createOrUpdateComponent(bomComponent);
            components.add(component);
        }

        return components;
    }

    private Component createOrUpdateComponent(org.cyclonedx.model.Component bomComponent) {
        String name = bomComponent.getName();
        String group = bomComponent.getGroup();
        String version = bomComponent.getVersion();

        Optional<Component> existingComponent = componentRepository.findByNameAndGroupAndVersion(
                name, group, version);

        if (existingComponent.isPresent()) {
            return existingComponent.get();
        }

        Component component = Component.builder()
                .name(name)
                .group(group)
                .version(version)
                .packageUrl(bomComponent.getPurl())
                .license(extractLicense(bomComponent))
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
                .build();
    }
}