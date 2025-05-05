package com.vulnview.service.impl;

import com.vulnview.entity.Component;
import com.vulnview.exception.NotFoundException;
import com.vulnview.repository.ComponentRepository;
import com.vulnview.service.ComponentService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ComponentServiceImpl implements ComponentService {
    private final ComponentRepository componentRepository;

    @Override
    @Transactional
    public Component createComponent(Component component) {
        return componentRepository.save(component);
    }

    @Override
    @Transactional
    public Component updateComponent(Long id, Component component) {
        Component existingComponent = componentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Component not found with id: " + id));
        
        existingComponent.setName(component.getName());
        existingComponent.setVersion(component.getVersion());
        existingComponent.setPackageUrl(component.getPackageUrl());
        existingComponent.setLicense(component.getLicense());
        existingComponent.setRiskLevel(component.getRiskLevel());
        existingComponent.setHash(component.getHash());
        existingComponent.setEvidence(component.getEvidence());
        
        return componentRepository.save(existingComponent);
    }

    @Override
    @Transactional
    public void deleteComponent(Long id) {
        if (!componentRepository.existsById(id)) {
            throw new NotFoundException("Component not found with id: " + id);
        }
        componentRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Component getComponentById(Long id) {
        return componentRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Component not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Component> getAllComponents(Pageable pageable) {
        return componentRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Component> searchComponents(String search, Pageable pageable) {
        return componentRepository.searchComponents(search, pageable);
    }
} 