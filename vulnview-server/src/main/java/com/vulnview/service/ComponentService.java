package com.vulnview.service;

import com.vulnview.dto.ComponentDto;
import com.vulnview.entity.Component;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface ComponentService {
    Component createComponent(Component component);
    Component updateComponent(Long id, Component component);
    void deleteComponent(Long id);
    Component getComponentById(Long id);
    Page<Component> getAllComponents(Pageable pageable);
    Page<Component> searchComponents(String search, Pageable pageable);
    Page<Component> getComponentsByProject(Long projectId, Pageable pageable);
    ComponentDto getComponent(Long id);
    List<ComponentDto> getComponentsByProject(Long projectId);
} 