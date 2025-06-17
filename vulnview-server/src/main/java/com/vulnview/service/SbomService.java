package com.vulnview.service;

import com.vulnview.dto.pipeline.DependencyResponse;
import com.vulnview.dto.pipeline.DetailComponentResponse;
import com.vulnview.dto.sbom.SbomDto;
import com.vulnview.entity.Sbom;
import com.vulnview.entity.Component;
import com.vulnview.entity.DependencyEdge;

import java.util.List;
import java.util.Optional;

public interface SbomService {
    void processSbom(String projectName, String pipelineName, SbomDto sbomDto);
    List<DependencyResponse> getDependenciesOfLatestBuild(String projectName, String pipelineName);
    List<DetailComponentResponse> getComponentsOfLatestBuild(String projectName, String pipelineName);
    Sbom createSbom(SbomDto sbomDto);
    Sbom getSbomById(Long id);
    void deleteSbom(Long id);
    Optional<Sbom> getSbomByBuildId(String buildId);
    List<Component> getComponentsBySbomId(Long sbomId);
    List<DependencyEdge> getDependenciesBySbomId(Long sbomId);
    List<Sbom> getRepositorySboms(Long repositoryId);
}