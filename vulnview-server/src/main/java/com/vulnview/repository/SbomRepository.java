package com.vulnview.repository;

import com.vulnview.entity.Sbom;
import com.vulnview.entity.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SbomRepository extends JpaRepository<Sbom, Long> {
    Optional<Sbom> findByBuildId(Long buildId);
    Optional<Sbom> findFirstByBuild_ProjectOrderByCreatedAtDesc(Project project);
    Optional<Sbom> findFirstByRepositoryIdOrderByCreatedAtDesc(Long repositoryId);
    
    @Query("SELECT s FROM Sbom s " +
           "JOIN s.build b " +
           "JOIN b.pipeline p " +
           "JOIN p.project pr " +
           "WHERE pr.name = :projectName AND p.name = :pipelineName " +
           "ORDER BY s.createdAt DESC")
    Optional<Sbom> findLatestByProjectNameAndPipelineName(@Param("projectName") String projectName, 
                                                         @Param("pipelineName") String pipelineName);

    @Query("SELECT s FROM Sbom s " +
           "JOIN s.build b " +
           "JOIN b.pipeline p " +
           "JOIN p.project pr " +
           "JOIN pr.repositories r " +
           "WHERE r.id = :repositoryId " +
           "ORDER BY s.createdAt DESC")
    List<Sbom> findByRepositoryId(@Param("repositoryId") Long repositoryId);

    @Query("SELECT s FROM Sbom s JOIN s.repository r WHERE r.id = :repositoryId ORDER BY s.createdAt DESC")
    Page<Sbom> findByRepositoryId(@Param("repositoryId") Long repositoryId, Pageable pageable);
} 