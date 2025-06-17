package com.vulnview.service.impl;

import com.vulnview.dto.SBOMUploadResponse;
import com.vulnview.entity.Sbom;
import com.vulnview.entity.Project;
import com.vulnview.repository.SbomRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.service.ISBOMProcessingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Slf4j
@Service
@RequiredArgsConstructor
public class SBOMProcessingServiceImpl implements ISBOMProcessingService {

    private final SbomRepository sbomRepository;
    private final ProjectRepository projectRepository;

    @Override
    public SBOMUploadResponse processSBOMFile(MultipartFile file, String projectName, String username) {
        // TODO: Implement SBOM file processing
        return null;
    }

    @Override
    public SBOMUploadResponse processSBOMData(String sbomData, String projectName, String username) {
        // TODO: Implement SBOM data processing
        return null;
    }

    @Override
    public SBOMUploadResponse processSBOM(MultipartFile file, String projectName) {
        // TODO: Implement SBOM processing
        return null;
    }

    @Override
    public void processSBOM(Long projectId, String sbomContent) {
        // TODO: Implement SBOM processing
    }

    @Override
    public Sbom getSBOMForProject(Long projectId) {
        return projectRepository.findById(projectId)
                .map(project -> sbomRepository.findFirstByBuild_ProjectOrderByCreatedAtDesc(project))
                .flatMap(optional -> optional)
                .orElse(null);
    }

    @Override
    public Sbom getSBOMById(Long id) {
        return sbomRepository.findById(id)
                .orElse(null);
    }
} 