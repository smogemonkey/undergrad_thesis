package com.vulnview.service;

import com.vulnview.dto.BuildDTO;
import com.vulnview.dto.build.CompareBuildResponse;
import com.vulnview.dto.build.ComponentResponse;
import com.vulnview.dto.build.DependencyResponse;
import com.vulnview.entity.Build;
import org.springframework.data.domain.Page;
import java.util.Optional;

public interface BuildService {
    /**
     * Creates a new build record for a project's repository
     * @param buildDTO Build information including project, repository, and commit details
     * @return Created build information
     */
    BuildDTO createBuild(BuildDTO buildDTO);

    /**
     * Retrieves a specific build by ID
     * @param id Build ID
     * @return Build information
     */
    BuildDTO getBuild(Long id);

    /**
     * Retrieves a build by its string ID
     * @param id Build ID as string
     * @return Optional build entity
     */
    Optional<Build> getBuildById(String id);

    /**
     * Gets all builds for a project with pagination
     * @param projectId Project ID
     * @param page Page number
     * @param size Page size
     * @return Page of builds
     */
    Page<BuildDTO> getBuildsByProject(Long projectId, int page, int size);

    /**
     * Gets all builds for a pipeline with pagination
     * @param pipelineId Pipeline ID
     * @param page Page number
     * @param size Page size
     * @return Page of builds
     */
    Page<BuildDTO> getBuildsByPipeline(Long pipelineId, int page, int size);

    /**
     * Gets components for a specific build with pagination
     * @param buildId Build ID
     * @param page Page number
     * @param size Page size
     * @return Page of components
     */
    Page<ComponentResponse> getBuildComponents(Long buildId, int page, int size);

    /**
     * Gets dependencies for a specific build with pagination
     * @param buildId Build ID
     * @param page Page number
     * @param size Page size
     * @return Page of dependencies
     */
    Page<DependencyResponse> getBuildDependencies(Long buildId, int page, int size);

    /**
     * Compares two builds and returns the differences in components and vulnerabilities
     * @param buildId1 First build ID
     * @param buildId2 Second build ID
     * @return Comparison results including added/removed/changed components and vulnerabilities
     */
    CompareBuildResponse compareBuilds(Long buildId1, Long buildId2);

    /**
     * Creates a build from an SBOM
     * @param projectId Project ID
     * @param repositoryId Repository ID
     * @param sbomId SBOM ID
     * @return Created build information
     */
    BuildDTO createBuildFromSbom(Long projectId, Long repositoryId, Long sbomId);

    /**
     * Gets the latest build for a repository
     * @param repositoryId Repository ID
     * @return Optional build information
     */
    Optional<BuildDTO> getLatestBuildForRepository(Long repositoryId);
}