package com.vulnview.service;

import com.vulnview.dto.pipeline.DependencyResponse;
import com.vulnview.dto.pipeline.DetailComponentResponse;
import com.vulnview.dto.sbom.SbomDto;
import com.vulnview.entity.Sbom;

import java.util.List;

public interface SbomService {
    void processSbom(String projectName, String pipelineName, SbomDto sbomDto);
    List<DependencyResponse> getDependenciesOfLatestBuild(String projectName, String pipelineName);
    List<DetailComponentResponse> getComponentsOfLatestBuild(String projectName, String pipelineName);
    Sbom createSbom(SbomDto sbomDto);
    Sbom getSbomById(Long id);
    void deleteSbom(Long id);
} 