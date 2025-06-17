package com.vulnview.service;

import com.vulnview.entity.Component;
import com.vulnview.entity.DependencyEdge;
import com.vulnview.repository.DependencyEdgeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DependencyEdgeService {
    private final DependencyEdgeRepository dependencyEdgeRepository;

    @Transactional(readOnly = true)
    public List<DependencyEdge> getDependencyEdgesByProject(Long projectId) {
        return dependencyEdgeRepository.findAll().stream()
                .filter(edge -> edge.getSourceComponent() != null && 
                        edge.getSourceComponent().getProject() != null && 
                        edge.getSourceComponent().getProject().getId().equals(projectId))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDependencyGraphData(Long projectId) {
        List<DependencyEdge> edges = getDependencyEdgesByProject(projectId);
        
        // Create nodes list
        Set<Map<String, Object>> nodes = new HashSet<>();
        // Create edges list
        List<Map<String, Object>> graphEdges = new ArrayList<>();
        
        for (DependencyEdge edge : edges) {
            if (edge.getSourceComponent() != null) {
                nodes.add(Map.of(
                    "id", edge.getSourceComponent().getId(),
                    "name", edge.getSourceComponent().getName(),
                    "version", edge.getSourceComponent().getVersion()
                ));
            }
            if (edge.getTargetComponent() != null) {
                nodes.add(Map.of(
                    "id", edge.getTargetComponent().getId(),
                    "name", edge.getTargetComponent().getName(),
                    "version", edge.getTargetComponent().getVersion()
                ));
            }
            if (edge.getSourceComponent() != null && edge.getTargetComponent() != null) {
                graphEdges.add(Map.of(
                    "source", edge.getSourceComponent().getId(),
                    "target", edge.getTargetComponent().getId()
                ));
            }
        }
        
        return Map.of("nodes", nodes, "edges", graphEdges);
    }

    @Transactional
    public void saveDependencyEdges(Long projectId, List<DependencyEdge> edges) {
        dependencyEdgeRepository.saveAll(edges);
    }

    public List<DependencyEdge> findBySourceComponent(Component component) {
        return dependencyEdgeRepository.findBySourceComponent(component);
    }

    public List<DependencyEdge> findBySourceComponentId(Long componentId) {
        return dependencyEdgeRepository.findBySourceComponentId(componentId);
    }

    public List<DependencyEdge> findBySourceComponentName(String componentName) {
        return dependencyEdgeRepository.findBySourceComponentName(componentName);
    }

    public List<DependencyEdge> findByTargetComponent(Component component) {
        return dependencyEdgeRepository.findByTargetComponent(component);
    }

    public List<DependencyEdge> findByTargetComponentId(Long componentId) {
        return dependencyEdgeRepository.findByTargetComponentId(componentId);
    }

    public List<DependencyEdge> findByTargetComponentName(String componentName) {
        return dependencyEdgeRepository.findByTargetComponentName(componentName);
    }

    public List<DependencyEdge> findBySourceAndTargetComponent(Component source, Component target) {
        return dependencyEdgeRepository.findBySourceComponentAndTargetComponent(source, target);
    }

    public List<DependencyEdge> findBySourceAndTargetComponentId(Long sourceId, Long targetId) {
        return dependencyEdgeRepository.findBySourceComponentIdAndTargetComponentId(sourceId, targetId);
    }

    public Set<Component> getDependencies(Component component) {
        return component.getDependencies();
    }

    public Set<Component> getDependents(Component component) {
        return component.getDependents();
    }
} 