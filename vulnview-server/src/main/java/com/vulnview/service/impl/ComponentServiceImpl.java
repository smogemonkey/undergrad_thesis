package com.vulnview.service.impl;

import com.vulnview.dto.ComponentDto;
import com.vulnview.entity.Component;
import com.vulnview.exception.ResourceNotFoundException;
import com.vulnview.mapper.ComponentMapper;
import com.vulnview.repository.ComponentRepository;
import com.vulnview.service.ComponentService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComponentServiceImpl implements ComponentService {

    private final ComponentRepository componentRepository;
    private final ComponentMapper componentMapper;

    @Override
    @Transactional
    public Component createComponent(Component component) {
        return componentRepository.save(component);
    }

    @Override
    @Transactional
    public Component updateComponent(Long id, Component component) {
        Component existingComponent = componentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Component not found with id: " + id));
        existingComponent.setName(component.getName());
        existingComponent.setVersion(component.getVersion());
        existingComponent.setGroupName(component.getGroupName());
        existingComponent.setType(component.getType());
        existingComponent.setDescription(component.getDescription());
        existingComponent.setPackageUrl(component.getPackageUrl());
        existingComponent.setHash(component.getHash());
        existingComponent.setEvidence(component.getEvidence());
        existingComponent.setRiskLevel(component.getRiskLevel());
        return componentRepository.save(existingComponent);
    }

    @Override
    @Transactional
    public void deleteComponent(Long id) {
        if (!componentRepository.existsById(id)) {
            throw new EntityNotFoundException("Component not found with id: " + id);
        }
        componentRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Component getComponentById(Long id) { 
        return componentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Component not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Component> getAllComponents(Pageable pageable) {
        return componentRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Component> searchComponents(String search, Pageable pageable) {
        return componentRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Component> getComponentsByProject(Long projectId, Pageable pageable) {
        return componentRepository.findByProjectId(projectId, pageable);
    }

    @Override
    public ComponentDto getComponent(Long id) {
        Component component = componentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Component not found"));
        return componentMapper.toDto(component);
    }

    @Override
    public List<ComponentDto> getComponentsByProject(Long projectId) {
        Page<Component> components = componentRepository.findByProjectId(projectId, Pageable.unpaged());
        return components.getContent().stream()
            .map(componentMapper::toDto)
            .collect(Collectors.toList());
    }
} 