package com.vulnview.service.impl;

import com.vulnview.dto.BuildDTO;
import com.vulnview.dto.build.CompareBuildResponse;
import com.vulnview.dto.build.ComponentResponse;
import com.vulnview.dto.build.DependencyResponse;
import com.vulnview.entity.*;
import com.vulnview.exception.NotFoundException;
import com.vulnview.repository.*;
import com.vulnview.service.BuildService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.PageImpl;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;
import java.util.Set;
import java.util.HashSet;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class BuildServiceImpl implements BuildService {

    private final BuildRepository buildRepository;
    private final ProjectRepository projectRepository;
    private final PipelineRepository pipelineRepository;
    private final RepositoryRepository repositoryRepository;
    private final SbomRepository sbomRepository;

    @Override
    @Transactional
    public BuildDTO createBuild(BuildDTO buildDTO) {
        log.info("Creating new build for project {} and pipeline {}", buildDTO.getProjectId(), buildDTO.getPipelineId());
        
        Project project = projectRepository.findById(buildDTO.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found: " + buildDTO.getProjectId()));
        
        Pipeline pipeline = pipelineRepository.findById(buildDTO.getPipelineId())
                .orElseThrow(() -> new NotFoundException("Pipeline not found: " + buildDTO.getPipelineId()));

        Build build = Build.builder()
                .project(project)
                .pipeline(pipeline)
                .repository(buildDTO.getRepository())
                .branch(buildDTO.getBranch())
                .buildNumber(buildDTO.getBuildNumber())
                .result(buildDTO.getResult())
                .duration(buildDTO.getDuration())
                .startAt(buildDTO.getStartAt())
                .build();

        build = buildRepository.save(build);
        log.info("Successfully created build with ID: {}", build.getId());
        return mapToDTO(build);
    }

    @Override
    @Transactional
    public BuildDTO createBuildFromSbom(Long projectId, Long repositoryId, Long sbomId) {
        log.info("Creating build from SBOM. Project: {}, Repository: {}, SBOM: {}", projectId, repositoryId, sbomId);
        
        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new NotFoundException("Project not found: " + projectId));
        
        Repository repository = repositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new NotFoundException("Repository not found: " + repositoryId));
        
        Sbom sbom = sbomRepository.findById(sbomId)
                .orElseThrow(() -> new NotFoundException("SBOM not found: " + sbomId));

        // Create a default pipeline if none exists
        Pipeline pipeline = pipelineRepository.findByProjectId(projectId, PageRequest.of(0, 1))
                .stream()
                .findFirst()
                .orElseGet(() -> {
                    Pipeline newPipeline = Pipeline.builder()
                            .project(project)
                            .name("Default Pipeline")
                            .description("Automatically created pipeline for SBOM processing")
                            .build();
                    return pipelineRepository.save(newPipeline);
                });

        // Get the next build number
        Long count = buildRepository.countByRepositoryName(repository.getName());
        Integer buildNumber = count.intValue() + 1;

        Build build = Build.builder()
                .project(project)
                .pipeline(pipeline)
                .repository(repository.getName())
                .branch(repository.getDefaultBranch())
                .buildNumber(buildNumber)
                .result("SUCCESS")
                .startAt(LocalDateTime.now())
                .sbom(sbom)
                .build();

        build = buildRepository.save(build);
        log.info("Successfully created build {} from SBOM {}", build.getId(), sbomId);
        return mapToDTO(build);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<BuildDTO> getLatestBuildForRepository(Long repositoryId) {
        log.info("Fetching latest build for repository: {}", repositoryId);
        Repository repository = repositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new NotFoundException("Repository not found: " + repositoryId));
        
        Page<Build> latestBuilds = buildRepository.findByRepositoryOrderByStartAtDesc(
            repository.getName(),
            PageRequest.of(0, 1)
        );
        
        return latestBuilds.stream().findFirst().map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public BuildDTO getBuild(Long id) {
        log.info("Fetching build: {}", id);
        Build build = buildRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Build not found: " + id));
        return mapToDTO(build);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BuildDTO> getBuildsByProject(Long projectId, int page, int size) {
        log.info("Fetching builds for project: {} (page: {}, size: {})", projectId, page, size);
        return buildRepository.findByProjectId(projectId, PageRequest.of(page, size))
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BuildDTO> getBuildsByPipeline(Long pipelineId, int page, int size) {
        log.info("Fetching builds for pipeline: {} (page: {}, size: {})", pipelineId, page, size);
        return buildRepository.findByPipelineId(pipelineId, PageRequest.of(page, size))
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<ComponentResponse> getBuildComponents(Long buildId, int page, int size) {
        log.info("Fetching components for build: {} (page: {}, size: {})", buildId, page, size);
        Build build = buildRepository.findById(buildId)
                .orElseThrow(() -> new NotFoundException("Build not found: " + buildId));
        
        if (build.getSbom() == null) {
            log.warn("No SBOM found for build: {}", buildId);
            return Page.empty(PageRequest.of(page, size));
        }
        
        return build.getSbom().getComponents().stream()
                .map(component -> ComponentResponse.builder()
                        .id(component.getId())
                        .name(component.getName())
                        .version(component.getVersion())
                        .type(component.getType())
                        .packageUrl(component.getPurl())
                        .build())
                .collect(Collectors.collectingAndThen(
                        Collectors.toList(),
                        list -> new org.springframework.data.domain.PageImpl<>(
                                list.subList(
                                        Math.min(page * size, list.size()),
                                        Math.min((page + 1) * size, list.size())
                                ),
                                PageRequest.of(page, size),
                                list.size()
                        )
                ));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<DependencyResponse> getBuildDependencies(Long buildId, int page, int size) {
        log.info("Fetching dependencies for build: {} (page: {}, size: {})", buildId, page, size);
        Build build = buildRepository.findById(buildId)
                .orElseThrow(() -> new NotFoundException("Build not found: " + buildId));
        
        if (build.getSbom() == null) {
            log.warn("No SBOM found for build: {}", buildId);
            return Page.empty(PageRequest.of(page, size));
        }

        List<DependencyResponse> dependencies = build.getSbom().getComponents().stream()
                .map(this::mapToDependencyResponse)
                .collect(Collectors.toList());

        int start = Math.min(page * size, dependencies.size());
        int end = Math.min((page + 1) * size, dependencies.size());
        
        return new PageImpl<>(
                dependencies.subList(start, end),
                                PageRequest.of(page, size),
                dependencies.size()
        );
    }

    @Override
    @Transactional(readOnly = true)
    public CompareBuildResponse compareBuilds(Long buildId1, Long buildId2) {
        log.info("Comparing builds: {} and {}", buildId1, buildId2);
        Build build1 = buildRepository.findById(buildId1)
                .orElseThrow(() -> new NotFoundException("Build 1 not found: " + buildId1));
        Build build2 = buildRepository.findById(buildId2)
                .orElseThrow(() -> new NotFoundException("Build 2 not found: " + buildId2));

        if (build1.getSbom() == null || build2.getSbom() == null) {
            throw new IllegalStateException("Both builds must have associated SBOMs");
        }

        // Create maps for efficient lookup
        Map<String, Component> components1Map = build1.getSbom().getComponents().stream()
                .collect(Collectors.toMap(Component::getPurl, c -> c, (c1, c2) -> c1));
        
        Map<String, Component> components2Map = build2.getSbom().getComponents().stream()
                .collect(Collectors.toMap(Component::getPurl, c -> c, (c1, c2) -> c1));

        // Find added and removed components efficiently
        Set<String> purls1 = components1Map.keySet();
        Set<String> purls2 = components2Map.keySet();
        
        Set<String> addedPurls = new HashSet<>(purls2);
        addedPurls.removeAll(purls1);
        
        Set<String> removedPurls = new HashSet<>(purls1);
        removedPurls.removeAll(purls2);
        
        // Find updated components
        Set<String> commonPurls = new HashSet<>(purls1);
        commonPurls.retainAll(purls2);
        
        Set<String> updatedPurls = commonPurls.stream()
                .filter(purl -> !components1Map.get(purl).getVersion().equals(components2Map.get(purl).getVersion()))
                .collect(Collectors.toSet());

        // Calculate vulnerability changes efficiently
        int vulnCount1 = components1Map.values().stream()
                .mapToInt(comp -> comp.getComponentVulnerabilities().size())
                .sum();
        
        int vulnCount2 = components2Map.values().stream()
                .mapToInt(comp -> comp.getComponentVulnerabilities().size())
                .sum();

        CompareBuildResponse response = CompareBuildResponse.builder()
                .build1(mapToDTO(build1))
                .build2(mapToDTO(build2))
                .addedComponents(addedPurls.size())
                .removedComponents(removedPurls.size())
                .updatedComponents(updatedPurls.size())
                .vulnerabilityChange(vulnCount2 - vulnCount1)
                .build();

        log.info("Build comparison complete. Found {} added, {} removed, {} updated components, {} vulnerability change",
                addedPurls.size(), removedPurls.size(), updatedPurls.size(), vulnCount2 - vulnCount1);

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Build> getBuildById(String id) {
        try {
            Long buildId = Long.parseLong(id);
            return buildRepository.findById(buildId);
        } catch (NumberFormatException e) {
            log.warn("Invalid build ID format: {}", id);
            return Optional.empty();
        }
    }

    private DependencyResponse mapToDependencyResponse(Component component) {
        return DependencyResponse.builder()
                .name(component.getName())
                .version(component.getVersion())
                .packageUrl(component.getPurl())
                .riskLevel(component.getRiskLevel() != null ? component.getRiskLevel().name() : null)
                .vulnerabilityCount(component.getComponentVulnerabilities().size())
                .build();
    }

    private BuildDTO mapToDTO(Build build) {
        return BuildDTO.builder()
                .id(build.getId())
                .projectId(build.getProject().getId())
                .pipelineId(build.getPipeline().getId())
                .repository(build.getRepository())
                .branch(build.getBranch())
                .buildNumber(build.getBuildNumber())
                .result(build.getResult())
                .duration(build.getDuration())
                .startAt(build.getStartAt())
                .createdAt(build.getCreatedAt())
                .updatedAt(build.getUpdatedAt())
                .sbomId(build.getSbom() != null ? build.getSbom().getId().toString() : null)
                .build();
    }

    private String generateBuildNumber(Repository repository) {
        Long count = buildRepository.countByRepositoryName(repository.getName());
        return repository.getName().toLowerCase().replaceAll("[^a-z0-9]", "-") + "-" + (count + 1);
    }
}