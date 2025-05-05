package com.vulnview.service.impl;

import com.vulnview.dto.PipelineDTO;
import com.vulnview.dto.pipeline.CreatePipelineRequest;
import com.vulnview.dto.pipeline.DependencyResponse;
import com.vulnview.dto.pipeline.DetailComponentResponse;
import com.vulnview.entity.Pipeline;
import com.vulnview.entity.Project;
import com.vulnview.exception.NotFoundException;
import com.vulnview.repository.PipelineRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.service.AuthenticationService;
import com.vulnview.service.PipelineService;
import com.vulnview.service.SbomService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PipelineServiceImpl implements PipelineService {
    private final PipelineRepository pipelineRepository;
    private final ProjectRepository projectRepository;
    private final AuthenticationService authenticationService;
    private final SbomService sbomService;

    @Override
    @Transactional
    public List<PipelineDTO> getAllByProjectName(String projectName) {
        Project project = projectRepository.findByNameAndOwnerId(projectName, authenticationService.getCurrentUserId())
                .orElseThrow(() -> new NotFoundException("Project not found"));

        if (authenticationService.isAdmin() || 
            authenticationService.isProjectAdmin(project.getId())) {
            return pipelineRepository.findAllByProjectName(projectName).stream()
                    .map(PipelineDTO::from)
                    .toList();
        }

        if (!authenticationService.isProjectMember(project.getId())) {
            throw new NotFoundException("Project not found");
        }

        Long userId = authenticationService.getCurrentUserId();
        return pipelineRepository.findAllByProjectNameAndUserId(projectName, userId.toString()).stream()
                .map(PipelineDTO::from)
                .toList();
    }

    @Override
    @Transactional
    public PipelineDTO create(String projectName, CreatePipelineRequest createPipelineRequest) {
        Project project = projectRepository.findByNameAndOwnerId(projectName, authenticationService.getCurrentUserId())
                .orElseThrow(() -> new NotFoundException("Project not found"));

        if (pipelineRepository.findByNameAndProjectName(createPipelineRequest.getName(), projectName) != null) {
            throw new NotFoundException("Pipeline name already exists");
        }

        Pipeline pipeline = new Pipeline();
        pipeline.setName(createPipelineRequest.getName());
        pipeline.setProject(project);

        return PipelineDTO.from(pipelineRepository.save(pipeline));
    }

    @Override
    public List<DependencyResponse> getDependenciesOfLatestBuild(String projectName, String pipelineName) {
        Pipeline pipeline = pipelineRepository.findByNameAndProjectName(pipelineName, projectName);
        if (pipeline == null) {
            throw new NotFoundException("Pipeline not found");
        }
        return sbomService.getDependenciesOfLatestBuild(projectName, pipelineName);
    }

    @Override
    public List<DetailComponentResponse> getComponentsOfLatestBuild(String projectName, String pipelineName) {
        Pipeline pipeline = pipelineRepository.findByNameAndProjectName(pipelineName, projectName);
        if (pipeline == null) {
            throw new NotFoundException("Pipeline not found");
        }
        return sbomService.getComponentsOfLatestBuild(projectName, pipelineName);
    }
} 