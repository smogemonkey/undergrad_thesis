package com.vulnview.service.impl;

import com.vulnview.dto.pipeline.DependencyResponse;
import com.vulnview.dto.pipeline.DetailComponentResponse;
import com.vulnview.dto.sbom.SbomDto;
import com.vulnview.entity.Build;
import com.vulnview.entity.Component;
import com.vulnview.entity.Pipeline;
import com.vulnview.entity.Sbom;
import com.vulnview.exception.NotFoundException;
import com.vulnview.repository.BuildRepository;
import com.vulnview.repository.PipelineRepository;
import com.vulnview.repository.SbomRepository;
import com.vulnview.service.SbomService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class SbomServiceImpl implements SbomService {
    private final PipelineRepository pipelineRepository;
    private final BuildRepository buildRepository;
    private final SbomRepository sbomRepository;

    @Override
    @Transactional
    public void processSbom(String projectName, String pipelineName, SbomDto sbomDto) {
        Pipeline pipeline = pipelineRepository.findByNameAndProjectName(pipelineName, projectName);
        if (pipeline == null) {
            throw new NotFoundException("Pipeline not found");
        }

        Build build = new Build();
        build.setPipeline(pipeline);
        build.setRepository(sbomDto.getFormat());
        build.setBranch(sbomDto.getVersion());
        build.setBuildNumber(1);
        build.setResult("SUCCESS");
        build.setDuration(0);
        build.setStartAt(java.time.LocalDateTime.now());

        Sbom sbom = new Sbom();
        sbom.setBuild(build);
        sbom.setContent(sbomDto.toString());

        List<Component> components = sbomDto.getComponents().stream()
                .map(componentDto -> {
                    Component component = new Component();
                    component.setName(componentDto.getName());
                    component.setVersion(componentDto.getVersion());
                    component.setPackageUrl(componentDto.getPackageUrl());
                    component.setLicense(componentDto.getLicense());
                    component.setProject(pipeline.getProject());
                    return component;
                })
                .collect(Collectors.toList());

        sbom.setComponents(components);
        build.setSbom(sbom);
        buildRepository.save(build);
    }

    @Override
    public List<DependencyResponse> getDependenciesOfLatestBuild(String projectName, String pipelineName) {
        Sbom sbom = sbomRepository.findLatestByProjectNameAndPipelineName(projectName, pipelineName);
        if (sbom == null) {
            throw new NotFoundException("No SBOM found for the latest build");
        }

        return sbom.getComponents().stream()
                .map(component -> DependencyResponse.builder()
                        .name(component.getName())
                        .version(component.getVersion())
                        .packageUrl(component.getPackageUrl())
                        .license(component.getLicense())
                        .riskLevel(component.getRiskLevel().name())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    public List<DetailComponentResponse> getComponentsOfLatestBuild(String projectName, String pipelineName) {
        Sbom sbom = sbomRepository.findLatestByProjectNameAndPipelineName(projectName, pipelineName);
        if (sbom == null) {
            throw new NotFoundException("No SBOM found for the latest build");
        }

        return sbom.getComponents().stream()
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
    @Transactional
    public Sbom createSbom(SbomDto sbomDto) {
        Sbom sbom = new Sbom();
        sbom.setContent(sbomDto.toString());
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
} 