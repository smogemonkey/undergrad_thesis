package com.vulnview.service.impl;

import com.vulnview.entity.License;
import com.vulnview.repository.LicenseRepository;
import com.vulnview.service.LicenseService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class LicenseServiceImpl implements LicenseService {

    private final LicenseRepository licenseRepository;

    @Override
    @Transactional
    public License createLicense(License license) {
        return licenseRepository.save(license);
    }

    @Override
    @Transactional
    public License updateLicense(Long id, License license) {
        License existingLicense = licenseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("License not found with id: " + id));
        
        existingLicense.setLicenseId(license.getLicenseId());
        existingLicense.setName(license.getName());
        existingLicense.setDescription(license.getDescription());
        existingLicense.setUrl(license.getUrl());
        
        return licenseRepository.save(existingLicense);
    }

    @Override
    @Transactional
    public void deleteLicense(Long id) {
        if (!licenseRepository.existsById(id)) {
            throw new EntityNotFoundException("License not found with id: " + id);
        }
        licenseRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public License getLicenseById(Long id) {
        return licenseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("License not found with id: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public License getLicenseByLicenseId(String licenseId) {
        License license = licenseRepository.findByLicenseId(licenseId);
        if (license == null) {
            throw new EntityNotFoundException("License not found with licenseId: " + licenseId);
        }
        return license;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<License> getAllLicenses(Pageable pageable) {
        return licenseRepository.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<License> searchLicenses(String search, Pageable pageable) {
        return licenseRepository.findBySearchString(search, pageable);
    }
} 