package com.vulnview.controller;

import com.vulnview.dto.sbom.SBOMUploadResponse;
import com.vulnview.service.SBOMProcessingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/sbom")
@RequiredArgsConstructor
@Tag(name = "SBOM", description = "SBOM management APIs")
@SecurityRequirement(name = "bearerAuth")
public class SBOMController {

    private final SBOMProcessingService sbomProcessingService;

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(
        summary = "Upload SBOM file",
        description = "Upload and process a CycloneDX SBOM file (JSON or XML format)"
    )
    public ResponseEntity<SBOMUploadResponse> uploadSBOM(
            @Parameter(description = "SBOM file to upload")
            @RequestParam("file") MultipartFile file,
            
            @Parameter(description = "Project name")
            @RequestParam("projectName") @NotBlank String projectName
    ) {
        validateFile(file);
        return ResponseEntity.ok(sbomProcessingService.processSBOMFile(file, projectName));
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("File cannot be empty");
        }

        String contentType = file.getContentType();
        if (contentType == null || (!contentType.equals("application/json") && 
                                  !contentType.equals("application/xml") &&
                                  !contentType.equals("text/xml"))) {
            throw new IllegalArgumentException("Invalid file type. Only JSON and XML files are supported");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || (!filename.endsWith(".json") && !filename.endsWith(".xml"))) {
            throw new IllegalArgumentException("Invalid file extension. Only .json and .xml files are supported");
        }
    }
} 