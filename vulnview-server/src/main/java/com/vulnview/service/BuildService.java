package com.vulnview.service;

import com.vulnview.dto.BuildDTO;
import com.vulnview.dto.build.CompareBuildResponse;
import com.vulnview.dto.build.ComponentResponse;
import com.vulnview.dto.build.DetailComponentResponse;
import com.vulnview.dto.build.DependencyResponse;
import com.vulnview.dto.sbom.SbomDto;
import org.springframework.data.domain.Page;

import java.time.LocalDateTime;
import java.util.List;

public interface BuildService {
    void createBuild(String projectName, String pipelineName, String repository, String branch, 
                    int buildNumber, String result, long duration, LocalDateTime startAt, SbomDto sbomDto);
    Page<BuildDTO> getAllBuildsOfPipeline(String projectName, String pipelineName, int page, int size);
    BuildDTO getLatestBuild(String projectName, String pipelineName);
    CompareBuildResponse compareBuilds(Long buildId1, Long buildId2);
    List<ComponentResponse> getComponentsOfBuild(Long buildId);
    List<DetailComponentResponse> getDetailComponentsByBuildId(Long buildId);
    List<DependencyResponse> getDependenciesByBuildId(Long buildId);
} 