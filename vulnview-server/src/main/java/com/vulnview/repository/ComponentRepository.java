package com.vulnview.repository;

import com.vulnview.entity.Component;
import com.vulnview.entity.RiskLevel;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComponentRepository extends JpaRepository<Component, Long> {
    Optional<Component> findByNameAndGroupAndVersion(String name, String group, String version);
    
    Page<Component> findByRiskLevel(RiskLevel riskLevel, Pageable pageable);
    
    @Query("SELECT c FROM Component c WHERE c.name LIKE %:search% OR c.group LIKE %:search%")
    Page<Component> searchComponents(String search, Pageable pageable);
    
    @Query("SELECT c FROM Component c WHERE c.vulnerabilities IS NOT EMPTY")
    List<Component> findVulnerableComponents();
    
    @Query("SELECT COUNT(c) FROM Component c WHERE c.riskLevel = :riskLevel")
    long countByRiskLevel(RiskLevel riskLevel);

    List<Component> findByProjectId(Long projectId);

    Component findByPackageUrl(String packageUrl);
} 