package com.vulnview.controller;

import com.vulnview.dto.sbom.SBOMUploadResponse;
import com.vulnview.dto.sbom.SbomDto;
import com.vulnview.service.SBOMProcessingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/sbom")
@RequiredArgsConstructor
@Tag(name = "SBOM", description = "SBOM management APIs")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
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
        try {
            log.info("Received SBOM upload request for project: {}", projectName);
            log.info("File name: {}, size: {} bytes, content type: {}", 
                    file.getOriginalFilename(), file.getSize(), file.getContentType());
            
            if (file == null || file.isEmpty()) {
                log.error("No file was uploaded");
                return ResponseEntity.badRequest()
                    .body(SBOMUploadResponse.builder()
                            .status("ERROR")
                            .message("No file was uploaded")
                            .errors(List.of("File is required"))
                            .build());
            }
            
            validateFile(file);
            
            SBOMUploadResponse response = sbomProcessingService.processSBOMFile(file, projectName);
            if ("ERROR".equals(response.getStatus())) {
                log.error("Error processing SBOM: {}", response.getMessage());
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(response);
            }
            
            log.info("SBOM upload processed successfully for project: {}", projectName);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.error("Invalid file format or content", e);
            return ResponseEntity.badRequest()
                    .body(SBOMUploadResponse.builder()
                            .status("ERROR")
                            .message("Invalid file format or content: " + e.getMessage())
                            .errors(List.of(e.getMessage()))
                            .build());
        } catch (Exception e) {
            log.error("Error processing SBOM upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SBOMUploadResponse.builder()
                            .status("ERROR")
                            .message("Failed to process SBOM file: " + e.getMessage())
                            .errors(List.of(e.getMessage()))
                            .build());
        }
    }

    @PostMapping(value = "/upload/direct", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "Upload SBOM data directly",
        description = "Upload and process SBOM data directly in JSON format"
    )
    public ResponseEntity<SBOMUploadResponse> uploadSBOMDirect(
            @Parameter(description = "SBOM data to upload")
            @Valid @RequestBody SbomDto sbomDto,
            
            @Parameter(description = "Project name")
            @RequestParam("projectName") @NotBlank String projectName
    ) {
        try {
            log.info("Received direct SBOM upload request for project: {}", projectName);
            SBOMUploadResponse response = sbomProcessingService.processSBOMData(sbomDto, projectName);
            log.info("Direct SBOM upload processed successfully for project: {}", projectName);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing direct SBOM upload", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SBOMUploadResponse.builder()
                            .status("ERROR")
                            .message("Failed to process SBOM data: " + e.getMessage())
                            .errors(List.of(e.getMessage()))
                            .build());
        }
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