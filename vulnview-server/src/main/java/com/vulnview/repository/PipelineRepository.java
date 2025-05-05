package com.vulnview.repository;

import com.vulnview.entity.Pipeline;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface PipelineRepository extends JpaRepository<Pipeline, Long> {
    List<Pipeline> findAllByProjectName(String projectName);

    @Query("SELECT p FROM Pipeline p " +
           "JOIN p.project pr " +
           "WHERE pr.name = :projectName AND pr.owner.id = :userId")
    List<Pipeline> findAllByProjectNameAndUserId(@Param("projectName") String projectName, 
                                               @Param("userId") String userId);

    Pipeline findByNameAndProjectName(String name, String projectName);
} 