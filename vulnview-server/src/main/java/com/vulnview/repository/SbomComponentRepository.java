package com.vulnview.repository;

import com.vulnview.entity.SbomComponent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SbomComponentRepository extends JpaRepository<SbomComponent, Long> {
    /**
     * Find all SbomComponents for a given SBOM ID
     * @param sbomId The ID of the SBOM
     * @return List of SbomComponents
     */
    List<SbomComponent> findBySbomId(Long sbomId);
} 