package com.vulnview.repository;

import com.vulnview.entity.AiSolution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AiSolutionRepository extends JpaRepository<AiSolution, Long> {
    List<AiSolution> findAllByOrderByCreatedAtDesc();
    List<AiSolution> findByVulnerabilityId(String vulnerabilityId);
} 