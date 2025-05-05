package com.vulnview.service;

import com.vulnview.dto.PipelineDTO;
import com.vulnview.dto.pipeline.CreatePipelineRequest;
import com.vulnview.dto.pipeline.DependencyResponse;
import com.vulnview.dto.pipeline.DetailComponentResponse;

import java.util.List;

public interface PipelineService {
    List<PipelineDTO> getAllByProjectName(String projectName);
    PipelineDTO create(String projectName, CreatePipelineRequest createPipelineRequest);
    List<DependencyResponse> getDependenciesOfLatestBuild(String projectName, String pipelineName);
    List<DetailComponentResponse> getComponentsOfLatestBuild(String projectName, String pipelineName);
} 