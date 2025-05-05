package com.vulnview.service;

import com.vulnview.entity.NpmPackage;
import java.util.List;

public interface NpmPackageService {
    List<NpmPackage> getAllNpmPackages();
    NpmPackage getNpmPackageById(Long id);
    NpmPackage createNpmPackage(NpmPackage npmPackage);
    NpmPackage updateNpmPackage(NpmPackage npmPackage);
    void deleteNpmPackage(Long id);
} 