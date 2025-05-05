package com.vulnview.service;

import com.vulnview.entity.License;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface LicenseService {
    License createLicense(License license);
    License updateLicense(Long id, License license);
    void deleteLicense(Long id);
    License getLicenseById(Long id);
    License getLicenseByLicenseId(String licenseId);
    Page<License> getAllLicenses(Pageable pageable);
    Page<License> searchLicenses(String search, Pageable pageable);
} 