package com.vulnview.repository;

import com.vulnview.entity.Component;
import com.vulnview.entity.DependencyEdge;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DependencyEdgeRepository extends JpaRepository<DependencyEdge, Long> {
    List<DependencyEdge> findBySourceComponent(Component component);
    List<DependencyEdge> findBySourceComponentId(Long componentId);
    List<DependencyEdge> findBySourceComponentName(String componentName);
    
    List<DependencyEdge> findByTargetComponent(Component component);
    List<DependencyEdge> findByTargetComponentId(Long componentId);
    List<DependencyEdge> findByTargetComponentName(String componentName);
    
    List<DependencyEdge> findBySourceComponentAndTargetComponent(Component source, Component target);
    List<DependencyEdge> findBySourceComponentIdAndTargetComponentId(Long sourceId, Long targetId);
    
    List<DependencyEdge> findBySbomId(Long sbomId);
} 