package com.vulnview.service.impl;

import com.vulnview.dto.BuildDTO;
import com.vulnview.dto.NotificationDto;
import com.vulnview.dto.build.CompareBuildResponse;
import com.vulnview.dto.build.ComponentResponse;
import com.vulnview.dto.build.DetailComponentResponse;
import com.vulnview.dto.build.DependencyResponse;
import com.vulnview.dto.sbom.SbomDto;
import com.vulnview.entity.Build;
import com.vulnview.entity.Component;
import com.vulnview.entity.Pipeline;
import com.vulnview.entity.Sbom;
import com.vulnview.exception.NotFoundException;
import com.vulnview.repository.BuildRepository;
import com.vulnview.repository.PipelineRepository;
import com.vulnview.repository.SbomRepository;
import com.vulnview.service.BuildService;
import com.vulnview.service.NotificationService;
import com.vulnview.service.SbomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class BuildServiceImpl implements BuildService {
    private final BuildRepository buildRepository;
    private final SbomService sbomService;
    private final SbomRepository sbomRepository;
    private final PipelineRepository pipelineRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional
    public void createBuild(String projectName, String pipelineName, String repository, String branch, 
                          int buildNumber, String result, long duration, LocalDateTime startAt, SbomDto sbomDto) {
        Pipeline pipeline = pipelineRepository.findByNameAndProjectName(pipelineName, projectName);
        if (pipeline == null) {
            throw new NotFoundException("Pipeline not found");
        }

        Build build = new Build();
        build.setPipeline(pipeline);
        build.setRepository(repository);
        build.setBranch(branch);
        build.setBuildNumber(buildNumber);
        build.setResult(result);
        build.setDuration(duration);
        build.setStartAt(startAt);

        Sbom sbom = new Sbom();
        sbom.setBuild(build);
        sbom.setContent(sbomDto.toString());

        List<Component> components = sbomDto.getComponents().stream()
                .map(componentDto -> {
                    Component component = new Component();
                    component.setName(componentDto.getName());
                    component.setVersion(componentDto.getVersion());
                    component.setPackageUrl(componentDto.getPurl());
                    component.setLicense(componentDto.getLicenses() != null && !componentDto.getLicenses().isEmpty() ? 
                            componentDto.getLicenses().get(0) : null);
                    component.setProject(pipeline.getProject());
                    return component;
                })
                .collect(Collectors.toList());

        sbom.setComponents(components);
        build.setSbom(sbom);
        buildRepository.save(build);

        notificationService.sendNotification("/topic/builds", 
                new NotificationDto("Build completed", "Build #" + buildNumber + " completed for " + pipelineName));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<BuildDTO> getAllBuildsOfPipeline(String projectName, String pipelineName, int page, int size) {
        Pageable pageable = PageRequest.of(page - 1, size, Sort.by("buildNumber").descending());
        return buildRepository.findAllByProjectNameAndPipelineName(projectName, pipelineName, pageable)
                .map(BuildDTO::from);
    }

    @Override
    @Transactional(readOnly = true)
    public BuildDTO getLatestBuild(String projectName, String pipelineName) {
        Pageable pageable = PageRequest.of(0, 1, Sort.by("buildNumber").descending());
        List<Build> builds = buildRepository.findLatestByProjectNameAndPipelineName(projectName, pipelineName, pageable);
        if (builds.isEmpty()) {
            throw new NotFoundException("No builds found");
        }
        return BuildDTO.from(builds.get(0));
    }

    @Override
    @Transactional(readOnly = true)
    public CompareBuildResponse compareBuilds(Long buildId1, Long buildId2) {
        Build build1 = buildRepository.findById(buildId1)
                .orElseThrow(() -> new NotFoundException("Build not found: " + buildId1));
        Build build2 = buildRepository.findById(buildId2)
                .orElseThrow(() -> new NotFoundException("Build not found: " + buildId2));

        List<Component> components1 = build1.getSbom().getComponents();
        List<Component> components2 = build2.getSbom().getComponents();

        List<Component> addedComponents = components2.stream()
                .filter(c2 -> components1.stream().noneMatch(c1 -> c1.getName().equals(c2.getName())))
                .collect(Collectors.toList());

        List<Component> removedComponents = components1.stream()
                .filter(c1 -> components2.stream().noneMatch(c2 -> c2.getName().equals(c1.getName())))
                .collect(Collectors.toList());

        List<Component> updatedComponents = components2.stream()
                .filter(c2 -> components1.stream()
                        .anyMatch(c1 -> c1.getName().equals(c2.getName()) && !c1.getVersion().equals(c2.getVersion())))
                .collect(Collectors.toList());

        return CompareBuildResponse.builder()
                .addedComponents(addedComponents.stream()
                        .map(c -> CompareBuildResponse.ComponentDiff.builder()
                                .name(c.getName())
                                .version(c.getVersion())
                                .packageUrl(c.getPackageUrl())
                                .license(c.getLicense())
                                .riskLevel(c.getRiskLevel().name())
                                .build())
                        .collect(Collectors.toList()))
                .removedComponents(removedComponents.stream()
                        .map(c -> CompareBuildResponse.ComponentDiff.builder()
                                .name(c.getName())
                                .version(c.getVersion())
                                .packageUrl(c.getPackageUrl())
                                .license(c.getLicense())
                                .riskLevel(c.getRiskLevel().name())
                                .build())
                        .collect(Collectors.toList()))
                .updatedComponents(updatedComponents.stream()
                        .map(c -> CompareBuildResponse.ComponentDiff.builder()
                                .name(c.getName())
                                .version(c.getVersion())
                                .packageUrl(c.getPackageUrl())
                                .license(c.getLicense())
                                .riskLevel(c.getRiskLevel().name())
                                .build())
                        .collect(Collectors.toList()))
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComponentResponse> getComponentsOfBuild(Long buildId) {
        Build build = buildRepository.findById(buildId)
                .orElseThrow(() -> new NotFoundException("Build not found: " + buildId));

        return build.getSbom().getComponents().stream()
                .map(component -> ComponentResponse.builder()
                        .name(component.getName())
                        .version(component.getVersion())
                        .packageUrl(component.getPackageUrl())
                        .license(component.getLicense())
                        .riskLevel(component.getRiskLevel().name())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DetailComponentResponse> getDetailComponentsByBuildId(Long buildId) {
        Build build = buildRepository.findById(buildId)
                .orElseThrow(() -> new NotFoundException("Build not found: " + buildId));

        return build.getSbom().getComponents().stream()
                .map(component -> DetailComponentResponse.builder()
                        .name(component.getName())
                        .version(component.getVersion())
                        .packageUrl(component.getPackageUrl())
                        .license(component.getLicense())
                        .riskLevel(component.getRiskLevel().name())
                        .vulnerabilities(component.getVulnerabilities().stream()
                                .map(v -> v.getCveId())
                                .collect(Collectors.toList()))
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DependencyResponse> getDependenciesByBuildId(Long buildId) {
        Build build = buildRepository.findById(buildId)
                .orElseThrow(() -> new NotFoundException("Build not found: " + buildId));

        return build.getSbom().getComponents().stream()
                .map(component -> DependencyResponse.builder()
                        .name(component.getName())
                        .version(component.getVersion())
                        .packageUrl(component.getPackageUrl())
                        .license(component.getLicense())
                        .riskLevel(component.getRiskLevel().name())
                        .build())
                .collect(Collectors.toList());
    }
} 