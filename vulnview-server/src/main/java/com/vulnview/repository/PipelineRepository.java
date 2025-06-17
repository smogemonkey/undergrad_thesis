package com.vulnview.repository;

import com.vulnview.entity.Pipeline;
import com.vulnview.exception.NotFoundException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PipelineRepository extends JpaRepository<Pipeline, Long> {
    @Query("SELECT p FROM Pipeline p WHERE p.project.name = :projectName ORDER BY p.createdAt DESC")
    List<Pipeline> findByProjectName(@Param("projectName") String projectName);

    @Query("SELECT p FROM Pipeline p JOIN p.project pr WHERE pr.name = :projectName AND pr.ownerId = :userId")
    Optional<Pipeline> findByProjectNameAndUserId(@Param("projectName") String projectName, @Param("userId") Long userId);

    @Query("SELECT p FROM Pipeline p WHERE p.name = :name AND p.project.name = :projectName")
    Optional<Pipeline> findByNameAndProjectName(@Param("name") String name, 
                                              @Param("projectName") String projectName);

    @Query("SELECT p FROM Pipeline p WHERE p.project.id = :projectId ORDER BY p.createdAt DESC")
    Page<Pipeline> findByProjectId(@Param("projectId") Long projectId, Pageable pageable);

    @Query("SELECT p FROM Pipeline p WHERE p.project.name = :projectName AND p.name = :pipelineName")
    Optional<Pipeline> findByProjectNameAndPipelineName(@Param("projectName") String projectName,
                                                      @Param("pipelineName") String pipelineName);

    default Pipeline findByProjectNameAndPipelineNameOrThrow(String projectName, String pipelineName) {
        return findByProjectNameAndPipelineName(projectName, pipelineName)
                .orElseThrow(() -> new NotFoundException("Pipeline not found"));
    }
} 