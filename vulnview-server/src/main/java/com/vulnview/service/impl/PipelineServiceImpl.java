package com.vulnview.service.impl;

import com.vulnview.dto.PipelineDTO;
import com.vulnview.dto.pipeline.CreatePipelineRequest;
import com.vulnview.dto.pipeline.DependencyResponse;
import com.vulnview.dto.pipeline.DetailComponentResponse;
import com.vulnview.entity.Build;
import com.vulnview.entity.Pipeline;
import com.vulnview.entity.Project;
import com.vulnview.exception.NotFoundException;
import com.vulnview.repository.BuildRepository;
import com.vulnview.repository.PipelineRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.service.PipelineService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PipelineServiceImpl implements PipelineService {

    private final PipelineRepository pipelineRepository;
    private final ProjectRepository projectRepository;
    private final BuildRepository buildRepository;

    @Override
    @Transactional
    public PipelineDTO createPipeline(PipelineDTO pipelineDTO) {
        if (pipelineDTO.getProjectId() == null) {
            throw new IllegalArgumentException("Project ID cannot be null");
        }

        Project project = projectRepository.findById(pipelineDTO.getProjectId())
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Pipeline pipeline = Pipeline.builder()
                .project(project)
                .name(pipelineDTO.getName())
                .description(pipelineDTO.getDescription())
                .type(pipelineDTO.getType())
                .status("ACTIVE")
                .build();

        pipeline = pipelineRepository.save(pipeline);
        return mapToDTO(pipeline);
    }

    @Override
    @Transactional
    public PipelineDTO create(String projectName, CreatePipelineRequest request) {
        Project project = projectRepository.findByName(projectName)
                .orElseThrow(() -> new NotFoundException("Project not found"));

        Pipeline pipeline = Pipeline.builder()
                .project(project)
                .name(request.getName())
                .description(request.getDescription())
                .type(request.getType())
                .status("ACTIVE")
                .build();

        pipeline = pipelineRepository.save(pipeline);
        return mapToDTO(pipeline);
    }

    @Override
    @Transactional(readOnly = true)
    public PipelineDTO getPipeline(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Pipeline ID cannot be null");
        }

        Pipeline pipeline = pipelineRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Pipeline not found"));
        return mapToDTO(pipeline);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<PipelineDTO> getPipelinesByProject(Long projectId, int page, int size) {
        if (projectId == null) {
            throw new IllegalArgumentException("Project ID cannot be null");
        }

        return pipelineRepository.findByProjectId(projectId, PageRequest.of(page, size))
                .map(this::mapToDTO);
    }

    @Override
    @Transactional(readOnly = true)
    public List<PipelineDTO> getAllByProjectName(String projectName) {
        if (projectName == null || projectName.trim().isEmpty()) {
            throw new IllegalArgumentException("Project name cannot be null or empty");
        }

        return pipelineRepository.findByProjectName(projectName).stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public PipelineDTO updatePipeline(Long id, PipelineDTO pipelineDTO) {
        if (id == null) {
            throw new IllegalArgumentException("Pipeline ID cannot be null");
        }

        Pipeline pipeline = pipelineRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Pipeline not found"));

        pipeline.setName(pipelineDTO.getName());
        pipeline.setDescription(pipelineDTO.getDescription());
        pipeline.setType(pipelineDTO.getType());

        pipeline = pipelineRepository.save(pipeline);
        return mapToDTO(pipeline);
    }

    @Override
    @Transactional
    public void deletePipeline(Long id) {
        if (id == null) {
            throw new IllegalArgumentException("Pipeline ID cannot be null");
        }

        if (!pipelineRepository.existsById(id)) {
            throw new NotFoundException("Pipeline not found");
        }
        pipelineRepository.deleteById(id);
    }

    @Override
    @Transactional
    public PipelineDTO updatePipelineStatus(Long id, String status) {
        if (id == null) {
            throw new IllegalArgumentException("Pipeline ID cannot be null");
        }

        Pipeline pipeline = pipelineRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Pipeline not found"));

        pipeline.setStatus(status);
        pipeline = pipelineRepository.save(pipeline);
        return mapToDTO(pipeline);
    }

    @Override
    @Transactional(readOnly = true)
    public List<DependencyResponse> getDependenciesOfLatestBuild(String projectName, String pipelineName) {
        if (projectName == null || pipelineName == null) {
            throw new IllegalArgumentException("Project name and pipeline name cannot be null");
        }

        Pipeline pipeline = pipelineRepository.findByProjectNameAndPipelineNameOrThrow(projectName, pipelineName);

        List<Build> builds = buildRepository.findLatestByProjectNameAndPipelineName(projectName, pipelineName, PageRequest.of(0, 1));
        if (builds.isEmpty()) {
            throw new NotFoundException("No builds found for pipeline");
        }

        Build latestBuild = builds.get(0);
        if (latestBuild.getSbom() == null) {
            throw new NotFoundException("No SBOM found for the latest build");
        }

        return latestBuild.getSbom().getComponents().stream()
                .map(component -> DependencyResponse.builder()
                        .name(component.getName())
                        .version(component.getVersion())
                        .packageUrl(component.getPackageUrl())
                        .riskLevel(component.getRiskLevel() != null ? component.getRiskLevel().name() : null)
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<DetailComponentResponse> getComponentsOfLatestBuild(String projectName, String pipelineName) {
        if (projectName == null || pipelineName == null) {
            throw new IllegalArgumentException("Project name and pipeline name cannot be null");
        }

        Pipeline pipeline = pipelineRepository.findByProjectNameAndPipelineNameOrThrow(projectName, pipelineName);

        List<Build> builds = buildRepository.findLatestByProjectNameAndPipelineName(projectName, pipelineName, PageRequest.of(0, 1));
        if (builds.isEmpty()) {
            throw new NotFoundException("No builds found for pipeline");
        }

        Build latestBuild = builds.get(0);
        if (latestBuild.getSbom() == null) {
            throw new NotFoundException("No SBOM found for the latest build");
        }

        return latestBuild.getSbom().getComponents().stream()
                .map(component -> DetailComponentResponse.builder()
                        .id(component.getId())
                        .name(component.getName())
                        .version(component.getVersion())
                        .type(component.getType())
                        .packageUrl(component.getPackageUrl())
                        .riskLevel(component.getRiskLevel() != null ? component.getRiskLevel().name() : null)
                        .build())
                .collect(Collectors.toList());
    }

    private PipelineDTO mapToDTO(Pipeline pipeline) {
        return PipelineDTO.builder()
                .id(pipeline.getId())
                .projectId(pipeline.getProject().getId())
                .name(pipeline.getName())
                .description(pipeline.getDescription())
                .type(pipeline.getType())
                .status(pipeline.getStatus())
                .createdAt(pipeline.getCreatedAt())
                .updatedAt(pipeline.getUpdatedAt())
                .build();
    }
} 