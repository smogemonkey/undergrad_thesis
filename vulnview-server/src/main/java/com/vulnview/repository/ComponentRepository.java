package com.vulnview.repository;

import com.vulnview.entity.Component;
import com.vulnview.entity.Project;
import com.vulnview.entity.RiskLevel;
import com.vulnview.entity.Sbom;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComponentRepository extends JpaRepository<Component, Long> {
    @Query("SELECT c FROM Component c WHERE c.packageUrl = :packageUrl ORDER BY c.id DESC")
    Optional<Component> findByPackageUrl(String packageUrl);
    Page<Component> findByProjectId(Long projectId, Pageable pageable);
    List<Component> findBySbomId(Long sbomId);
    
    @Query("SELECT c FROM Component c WHERE c.sbom.build.id = :buildId")
    List<Component> findByBuildId(Long buildId);
    
    // Alias for findByPackageUrl to maintain backward compatibility
    default Optional<Component> findByPurl(String purl) {
        return findByPackageUrl(purl);
    }

    List<Component> findByProject(Project project);
    long countByProject(Project project);
    long countVulnerableComponentsByProject(Project project);
    List<Component> findVulnerableComponentsByProject(Project project);

    @Query("SELECT c FROM Component c WHERE c.name = :name AND c.version = :version AND c.sbom.id = :sbomId")
    Optional<Component> findByNameAndVersionAndSbomId(@Param("name") String name, @Param("version") String version, @Param("sbomId") Long sbomId);

    long countBySbomId(Long sbomId);
    long countBySbomIdAndRiskLevelNot(Long sbomId, RiskLevel riskLevel);

    Optional<Component> findByNameAndVersionAndRepositoryId(String name, String version, Long repositoryId);

    @Modifying
    @Query("DELETE FROM Component c WHERE c.sbom.repository.id = :repositoryId")
    void deleteByRepositoryId(Long repositoryId);
}