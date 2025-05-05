package com.vulnview.repository;

import com.vulnview.entity.Sbom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SbomRepository extends JpaRepository<Sbom, Long> {
    @Query("SELECT s FROM Sbom s " +
           "JOIN s.build b " +
           "JOIN b.pipeline p " +
           "JOIN p.project pr " +
           "WHERE pr.name = :projectName AND p.name = :pipelineName " +
           "ORDER BY b.buildNumber DESC")
    Sbom findLatestByProjectNameAndPipelineName(@Param("projectName") String projectName,
                                              @Param("pipelineName") String pipelineName);
} 