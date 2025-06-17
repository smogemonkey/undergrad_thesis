package com.vulnview.service;

import com.vulnview.dto.SBOMUploadResponse;
import com.vulnview.entity.Sbom;
import org.springframework.web.multipart.MultipartFile;

public interface ISBOMProcessingService {
    SBOMUploadResponse processSBOMFile(MultipartFile file, String projectName, String username);
    SBOMUploadResponse processSBOMData(String sbomData, String projectName, String username);
    SBOMUploadResponse processSBOM(MultipartFile file, String projectName);
    void processSBOM(Long projectId, String sbomContent);
    Sbom getSBOMForProject(Long projectId);
    Sbom getSBOMById(Long id);
} 