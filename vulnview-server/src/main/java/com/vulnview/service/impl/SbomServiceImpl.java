package com.vulnview.service.impl;

import com.vulnview.dto.pipeline.DependencyResponse;
import com.vulnview.dto.pipeline.DetailComponentResponse;
import com.vulnview.dto.sbom.SbomDto;
import com.vulnview.entity.Build;
import com.vulnview.entity.Component;
import com.vulnview.entity.Pipeline;
import com.vulnview.entity.Sbom;
import com.vulnview.entity.DependencyEdge;
import com.vulnview.entity.ComponentVulnerability;
import com.vulnview.exception.NotFoundException;
import com.vulnview.repository.BuildRepository;
import com.vulnview.repository.PipelineRepository;
import com.vulnview.repository.SbomRepository;
import com.vulnview.repository.ComponentVulnerabilityRepository;
import com.vulnview.service.SbomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import java.nio.charset.StandardCharsets;
import java.util.Optional;
import java.util.HashSet;
import java.util.Map;
import java.util.ArrayList;

@Service
@RequiredArgsConstructor
public class SbomServiceImpl implements SbomService {
    private final PipelineRepository pipelineRepository;
    private final BuildRepository buildRepository;
    private final SbomRepository sbomRepository;
    private final ComponentVulnerabilityRepository componentVulnerabilityRepository;

    @Override
    @Transactional
    public void processSbom(String projectName, String pipelineName, SbomDto sbomDto) {
        Pipeline pipeline = pipelineRepository.findByProjectNameAndPipelineName(projectName, pipelineName)
                .orElseThrow(() -> new NotFoundException("Pipeline not found"));

        Build build = new Build();
        build.setPipeline(pipeline);
        build.setRepository(sbomDto.getBomFormat());
        build.setBranch(String.valueOf(sbomDto.getVersion()));
        build.setBuildNumber(1);
        build.setResult("SUCCESS");
        build.setDuration(0L);
        build.setStartAt(java.time.LocalDateTime.now());

        Sbom sbom = new Sbom();
        sbom.setBuild(build);
        sbom.setContent(sbomDto.toString().getBytes(StandardCharsets.UTF_8));

        Set<Component> components = sbomDto.getComponents().stream()
                .map(componentDto -> {
                    Component component = new Component();
                    component.setName(componentDto.getName());
                    component.setVersion(componentDto.getVersion());
                    component.setPackageUrl(componentDto.getPurl());
                    component.setProject(pipeline.getProject());
                    return component;
                })
                .collect(Collectors.toSet());

        sbom.setComponents(components);
        build.setSbom(sbom);
        buildRepository.save(build);
    }

    @Override
    public List<DependencyResponse> getDependenciesOfLatestBuild(String projectName, String pipelineName) {
        Sbom sbom = sbomRepository.findLatestByProjectNameAndPipelineName(projectName, pipelineName)
                .orElseThrow(() -> new NotFoundException("No SBOM found for the latest build"));

        return sbom.getComponents().stream()
                .map(component -> DependencyResponse.builder()
                        .name(component.getName())
                        .version(component.getVersion())
                        .packageUrl(component.getPackageUrl())
                        .riskLevel(component.getRiskLevel() != null ? component.getRiskLevel().name() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<DetailComponentResponse> getComponentsOfLatestBuild(String projectName, String pipelineName) {
        Sbom sbom = sbomRepository.findLatestByProjectNameAndPipelineName(projectName, pipelineName)
                .orElseThrow(() -> new NotFoundException("No SBOM found for the latest build"));

        return sbom.getComponents().stream()
                .map(this::convertToDetailComponentResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Sbom createSbom(SbomDto sbomDto) {
        Sbom sbom = new Sbom();
        sbom.setContent(sbomDto.toString().getBytes(StandardCharsets.UTF_8));
        return sbomRepository.save(sbom);
    }

    @Override
    @Transactional(readOnly = true)
    public Sbom getSbomById(Long id) {
        return sbomRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("SBOM not found with id: " + id));
    }

    @Override
    @Transactional
    public void deleteSbom(Long id) {
        if (!sbomRepository.existsById(id)) {
            throw new NotFoundException("SBOM not found with id: " + id);
        }
        sbomRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Sbom> getSbomByBuildId(String buildId) {
        try {
            Long id = Long.parseLong(buildId);
            return sbomRepository.findByBuildId(id);
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Component> getComponentsBySbomId(Long sbomId) {
        Sbom sbom = sbomRepository.findById(sbomId)
            .orElseThrow(() -> new NotFoundException("SBOM not found with id: " + sbomId));
        
        // Get all components for this SBOM
        Set<Component> components = sbom.getComponents();
        
        // Get all vulnerabilities for these components in a single query
        List<Long> componentIds = components.stream()
            .map(Component::getId)
            .collect(Collectors.toList());
            
        List<ComponentVulnerability> allVulnerabilities = componentVulnerabilityRepository.findByComponentIdIn(componentIds);
        
        // Create a map of component ID to its vulnerabilities
        Map<Long, List<ComponentVulnerability>> vulnsByComponent = allVulnerabilities.stream()
            .collect(Collectors.groupingBy(cv -> cv.getComponent().getId()));
            
        // Update each component with its vulnerabilities
        return components.stream()
            .peek(component -> {
                List<ComponentVulnerability> vulns = vulnsByComponent.getOrDefault(component.getId(), new ArrayList<>());
                component.setComponentVulnerabilities(new HashSet<>(vulns));
                
                // Load dependencies
                component.getOutgoingDependencies().size();
                component.getIncomingDependencies().size();
            })
            .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DependencyEdge> getDependenciesBySbomId(Long sbomId) {
        return sbomRepository.findById(sbomId)
                .map(Sbom::getDependencies)
                .map(Set::stream)
                .map(stream -> stream.collect(Collectors.toList()))
                .orElseThrow(() -> new NotFoundException("SBOM not found with id: " + sbomId));
    }

    @Override
    public List<Sbom> getRepositorySboms(Long repositoryId) {
        return sbomRepository.findByRepositoryId(repositoryId);
    }

    private DetailComponentResponse convertToDetailComponentResponse(Component component) {
        return DetailComponentResponse.builder()
            .id(component.getId())
            .name(component.getName())
            .version(component.getVersion())
            .groupName(component.getGroupName())
            .type(component.getType())
            .description(component.getDescription())
            .packageUrl(component.getPackageUrl())
            .hash(component.getHash())
            .evidence(component.getEvidence())
            .riskLevel(component.getRiskLevel() != null ? component.getRiskLevel().name() : null)
            .vulnerabilities(component.getComponentVulnerabilities().stream()
                .map(cv -> cv.getVulnerability().getCveId())
                .collect(Collectors.toList()))
            .build();
    }
} 

