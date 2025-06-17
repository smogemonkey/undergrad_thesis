package com.vulnview.repository;

import com.vulnview.entity.SbomDependency;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SbomDependencyRepository extends JpaRepository<SbomDependency, Long> {
    List<SbomDependency> findBySbomIdAndFromBomRef(Long sbomId, String fromBomRef);
} 
 