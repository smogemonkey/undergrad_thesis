package com.vulnview.repository;

import com.vulnview.entity.DependencyEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
 
@Repository
public interface DependencyEdgeRepository extends JpaRepository<DependencyEdge, Long> {
} 