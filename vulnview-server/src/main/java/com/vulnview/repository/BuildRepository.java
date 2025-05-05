package com.vulnview.repository;

import com.vulnview.entity.Build;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

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
} 