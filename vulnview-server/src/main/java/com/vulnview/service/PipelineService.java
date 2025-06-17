package com.vulnview.service;

import com.vulnview.dto.PipelineDTO;
import com.vulnview.dto.pipeline.CreatePipelineRequest;
import com.vulnview.dto.pipeline.DependencyResponse;
import com.vulnview.dto.pipeline.DetailComponentResponse;
import org.springframework.data.domain.Page;

import java.util.List;

public interface PipelineService {
    List<PipelineDTO> getAllByProjectName(String projectName);
    PipelineDTO create(String projectName, CreatePipelineRequest createPipelineRequest);
    List<DependencyResponse> getDependenciesOfLatestBuild(String projectName, String pipelineName);
    List<DetailComponentResponse> getComponentsOfLatestBuild(String projectName, String pipelineName);
    PipelineDTO createPipeline(PipelineDTO pipelineDTO);
    PipelineDTO getPipeline(Long id);
    Page<PipelineDTO> getPipelinesByProject(Long projectId, int page, int size);
    PipelineDTO updatePipeline(Long id, PipelineDTO pipelineDTO);
    void deletePipeline(Long id);
    PipelineDTO updatePipelineStatus(Long id, String status);
} 