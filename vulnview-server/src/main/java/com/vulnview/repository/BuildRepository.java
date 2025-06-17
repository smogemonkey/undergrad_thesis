package com.vulnview.repository;

import com.vulnview.entity.Build;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface BuildRepository extends JpaRepository<Build, Long> {
    @Query("SELECT b FROM Build b " +
           "JOIN b.pipeline p " +
           "JOIN p.project pr " +
           "WHERE pr.name = :projectName AND p.name = :pipelineName " +
           "ORDER BY b.buildNumber DESC")
    Page<Build> findAllByProjectNameAndPipelineName(@Param("projectName") String projectName,
                                                   @Param("pipelineName") String pipelineName,
                                                   Pageable pageable);

    @Query("SELECT b FROM Build b " +
           "JOIN b.pipeline p " +
           "JOIN p.project pr " +
           "WHERE pr.name = :projectName AND p.name = :pipelineName " +
           "ORDER BY b.buildNumber DESC")
    List<Build> findLatestByProjectNameAndPipelineName(@Param("projectName") String projectName,
                                                      @Param("pipelineName") String pipelineName,
                                                      Pageable pageable);

    @Query("SELECT b FROM Build b WHERE b.project.id = :projectId ORDER BY b.createdAt DESC")
    Page<Build> findByProjectId(@Param("projectId") Long projectId, Pageable pageable);

    @Query("SELECT b FROM Build b WHERE b.pipeline.id = :pipelineId ORDER BY b.createdAt DESC")
    Page<Build> findByPipelineId(@Param("pipelineId") Long pipelineId, Pageable pageable);

    /**
     * Find a build by its SBOM ID
     * @param sbomId The ID of the SBOM
     * @return Optional containing the build if found
     */
    Optional<Build> findBySbomId(Long sbomId);

    List<Build> findByProjectIdOrderByStartAtDesc(Long projectId);

    List<Build> findByProjectIdOrderByBuildNumberDesc(Long projectId);

    List<Build> findByProjectIdAndStartAtAfterOrderByStartAtDesc(Long projectId, LocalDateTime startDate);

    List<Build> findByProjectIdAndStartAtBetweenOrderByStartAtDesc(Long projectId, LocalDateTime startDate, LocalDateTime endDate);

    @Query("SELECT b FROM Build b WHERE b.pipeline.id = :pipelineId ORDER BY b.startAt DESC")
    List<Build> findByPipelineIdOrderByStartAtDesc(Long pipelineId);

    List<Build> findByProjectIdOrderByCreatedAtDesc(Long projectId);

    Optional<Build> findByBuildNumber(Integer buildNumber);

    @Query("SELECT b FROM Build b WHERE b.repository = :repository ORDER BY b.startAt DESC")
    Page<Build> findByRepositoryOrderByStartAtDesc(String repository, Pageable pageable);
    
    @Query("SELECT COUNT(b) FROM Build b WHERE b.repository = :repository")
    Long countByRepositoryName(String repository);
} 