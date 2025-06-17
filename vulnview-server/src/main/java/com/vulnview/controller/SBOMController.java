package com.vulnview.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vulnview.dto.SBOMUploadResponse;
import com.vulnview.dto.sbom.CycloneDxBomDto;
import com.vulnview.dto.sbom.component.ComponentDto;
import com.vulnview.dto.sbom.dependency.DependencyDto;
import com.vulnview.entity.Sbom;
import com.vulnview.entity.Repository;
import com.vulnview.entity.Component;
import com.vulnview.entity.ComponentVulnerability;
import com.vulnview.entity.Vulnerability;
import com.vulnview.exception.NotFoundException;
import com.vulnview.repository.SbomRepository;
import com.vulnview.repository.RepositoryRepository;
import com.vulnview.service.SBOMProcessingService;
import com.vulnview.service.UserService;
import com.vulnview.service.GitHubIntegrationService;
import com.vulnview.service.GraphDataService;
import com.vulnview.dto.graph.GraphDataResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.beans.factory.annotation.Autowired;
import com.vulnview.repository.ComponentVulnerabilityRepository;
import org.springframework.beans.factory.annotation.Value;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

import java.nio.charset.StandardCharsets;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;
import java.util.ArrayList;

@RestController
@RequestMapping("/api/v1/sbom")
@RequiredArgsConstructor
@Tag(name = "SBOM", description = "SBOM management APIs")
@SecurityRequirement(name = "bearerAuth")
@Slf4j
public class SBOMController {
    private final SBOMProcessingService sbomProcessingService;
    private final UserService userService;
    private final ObjectMapper objectMapper;
    private final SbomRepository sbomRepository;
    @Autowired
    private ComponentVulnerabilityRepository componentVulnerabilityRepository;
    private final RepositoryRepository repositoryRepository;
    private final GitHubIntegrationService gitHubIntegrationService;
    @Value("${cdxgen.path:cdxgen}")
    private String cdxgenPath;
    private final GraphDataService graphDataService;

    @PostMapping(value = "/upload", consumes = MediaType.APPLICATION_JSON_VALUE)
    @Operation(
        summary = "Upload SBOM data",
        description = "Upload and process SBOM data in JSON format"
    )
    public ResponseEntity<SBOMUploadResponse> uploadSBOM(
            @Parameter(description = "SBOM data to upload")
            @RequestBody CycloneDxBomDto sbomDto,
            
            @Parameter(description = "Project name")
            @RequestParam("projectName") @NotBlank String projectName,
            @RequestParam("repositoryId") Long repositoryId
    ) {
        log.info("=== SBOM Upload Request Started ===");
        log.info("Project Name: {}", projectName);
        log.info("Repository ID: {}", repositoryId);
        
        try {
            // Validate repository exists
            var repository = repositoryRepository.findById(repositoryId);
            if (repository.isEmpty()) {
                log.error("Repository not found with ID: {}", repositoryId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(SBOMUploadResponse.builder()
                        .status("ERROR")
                        .message("Repository not found")
                        .build());
            }
            log.info("Repository found: {}", repository.get().getName());
            
            // Check for existing SBOM
            var existingSbom = sbomRepository.findFirstByRepositoryIdOrderByCreatedAtDesc(repositoryId);
            if (existingSbom.isPresent()) {
                log.info("Found existing SBOM for repository. Updating instead of creating new one.");
                // Update existing SBOM with new data
                Sbom sbom = existingSbom.get();
                sbom.setBomFormat(sbomDto.getBomFormat());
                sbom.setSpecVersion(sbomDto.getSpecVersion());
                sbom.setSerialNumber(sbomDto.getSerialNumber());
                sbom.setVersion(String.valueOf(sbomDto.getVersion()));
                sbom.setContent(objectMapper.writeValueAsBytes(sbomDto));
                sbomRepository.save(sbom);
                
                log.info("Updated existing SBOM with ID: {}", sbom.getId());
                return ResponseEntity.ok(SBOMUploadResponse.builder()
                    .status("SUCCESS")
                    .message("SBOM updated successfully")
                    .sbomId(sbom.getId())
                    .build());
            }
            
            // Process new SBOM
            log.info("Processing new SBOM data...");
            SBOMUploadResponse response = sbomProcessingService.processSBOMData(sbomDto, projectName, "admin", repositoryId);
            log.info("SBOM processing response: {}", response);
            
            // Link SBOM to repository if not already linked
            if (response.getSbomId() != null) {
                log.info("Linking SBOM {} to repository {}", response.getSbomId(), repositoryId);
                var sbom = sbomRepository.findById(response.getSbomId()).orElse(null);
                if (sbom != null && sbom.getRepository() == null) {
                    sbom.setRepository(repository.get());
                    sbomRepository.save(sbom);
                    log.info("Successfully linked SBOM to repository");
                } else if (sbom == null) {
                    log.error("Failed to find SBOM with ID: {}", response.getSbomId());
                }
            }
            
            log.info("=== SBOM Upload Request Completed ===");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("=== SBOM Upload Request Failed ===");
            log.error("Error processing SBOM: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(SBOMUploadResponse.builder()
                            .status("ERROR")
                    .message("Failed to process SBOM: " + e.getMessage())
                            .build());
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<CycloneDxBomDto> getSBOM(@PathVariable Long id) {
        try {
            log.info("Retrieving SBOM with ID: {}", id);
            var sbomEntity = sbomRepository.findById(id).orElse(null);
            if (sbomEntity == null) {
                log.warn("No SBOM found with ID: {}", id);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            
            // Create a basic response with metadata even if content is null
            CycloneDxBomDto response = CycloneDxBomDto.builder()
                .bomFormat(sbomEntity.getBomFormat())
                .specVersion(sbomEntity.getSpecVersion())
                .serialNumber(sbomEntity.getSerialNumber())
                .version(Integer.parseInt(sbomEntity.getVersion()))
                .build();
                
            if (sbomEntity.getContent() == null) {
                log.warn("SBOM content is null for ID: {}", id);
                return ResponseEntity.ok(response);
            }
            
            try {
                String content = new String(sbomEntity.getContent(), StandardCharsets.UTF_8);
                if (content.trim().isEmpty()) {
                    log.warn("SBOM content is empty for ID: {}", id);
                    return ResponseEntity.ok(response);
                }
                
                CycloneDxBomDto sbom = objectMapper.readValue(content, CycloneDxBomDto.class);
                if (sbom != null) {
                    log.info("Successfully retrieved SBOM with ID: {}", id);
                    if (sbom.getComponents() != null) {
                        log.info("SBOM contains {} components", sbom.getComponents().size());
                    }
                    return ResponseEntity.ok(sbom);
                }
            } catch (Exception e) {
                log.error("Error parsing SBOM content for ID: {}: {}", id, e.getMessage());
                return ResponseEntity.ok(response);
            }
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error retrieving SBOM: {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/components")
    public ResponseEntity<Map<String, Object>> getSBOMComponents(@PathVariable Long id) {
        try {
            log.info("Retrieving components for SBOM ID: {}", id);
            Sbom sbom = sbomRepository.findById(id)
                    .orElseThrow(() -> new NotFoundException("SBOM not found with id: " + id));
            CycloneDxBomDto sbomDto = objectMapper.readValue(sbom.getContent(), CycloneDxBomDto.class);
            List<ComponentDto> components = (sbomDto != null && sbomDto.getComponents() != null) ? sbomDto.getComponents() : List.of();

            // Calculate summary
            int totalComponents = components.size();
            int vulnerableComponents = 0;
            Map<String, Integer> bySeverity = new java.util.HashMap<>();
            bySeverity.put("critical", 0);
            bySeverity.put("high", 0);
            bySeverity.put("medium", 0);
            bySeverity.put("low", 0);
            bySeverity.put("safe", 0);
            bySeverity.put("unknown", 0);

            for (ComponentDto comp : components) {
                boolean isVulnerable = false;
                if (comp.getVulnerabilities() != null && !comp.getVulnerabilities().isEmpty()) {
                    isVulnerable = true;
                    for (var vuln : comp.getVulnerabilities()) {
                        String sev = "unknown";
                        if (vuln.getRatings() != null && !vuln.getRatings().isEmpty() && vuln.getRatings().get(0).getSeverity() != null) {
                            sev = vuln.getRatings().get(0).getSeverity().toLowerCase();
                        }
                        bySeverity.put(sev, bySeverity.getOrDefault(sev, 0) + 1);
                    }
            } else {
                    bySeverity.put("safe", bySeverity.get("safe") + 1);
                }
                if (isVulnerable) vulnerableComponents++;
            }

            Map<String, Object> response = new java.util.HashMap<>();
            response.put("components", components);
            Map<String, Object> summary = new java.util.HashMap<>();
            summary.put("totalComponents", totalComponents);
            summary.put("vulnerableComponents", vulnerableComponents);
            summary.put("bySeverity", bySeverity);
            response.put("summary", summary);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error retrieving SBOM components: {}", id, e);
            Map<String, Object> response = new java.util.HashMap<>();
            response.put("components", List.of());
            Map<String, Object> summary = new java.util.HashMap<>();
            summary.put("totalComponents", 0);
            summary.put("vulnerableComponents", 0);
            summary.put("bySeverity", Map.of("critical", 0, "high", 0, "medium", 0, "low", 0, "safe", 0, "unknown", 0));
            response.put("summary", summary);
            return ResponseEntity.ok(response);
        }
    }

    @GetMapping("/api/v1/projects/{projectId}/sbom/status")
    public ResponseEntity<?> getSbomStatus(@PathVariable Long projectId) {
        // Find the latest SBOM for the project
        Sbom sbom = sbomRepository.findFirstByBuild_ProjectOrderByCreatedAtDesc(
            com.vulnview.entity.Project.builder().id(projectId).build()
        ).orElse(null);
        if (sbom == null) {
            return ResponseEntity.ok(Map.of(
                "hasSbom", false,
                "lastScan", null,
                "isScanning", false,
                "sbomId", null
            ));
        }
        return ResponseEntity.ok(Map.of(
            "hasSbom", true,
            "lastScan", sbom.getCreatedAt(),
            "isScanning", false,
            "sbomId", sbom.getId()
        ));
    }

    @GetMapping("/repositories/{repositoryId}/sboms")
    public ResponseEntity<?> getSbomsByRepository(
        @PathVariable Long repositoryId,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "50") int size,
        Principal principal
    ) {
        log.info("[SBOMController] getSbomsByRepository called by user='{}' for repositoryId={} (page={}, size={})", principal != null ? principal.getName() : "anonymous", repositoryId, page, size);
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Sbom> sbomPage = sbomRepository.findByRepositoryId(repositoryId, pageable);
        List<Map<String, Object>> sbomDtos = sbomPage.getContent().stream().map(sbom -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("sbomId", sbom.getId());
            map.put("commitSha", sbom.getCommitSha());
            map.put("commitMessage", sbom.getCommitMessage());
            map.put("commitAuthor", sbom.getCommitAuthor());
            map.put("createdAt", sbom.getCreatedAt());
            // Count vulnerabilities for this SBOM
            int vulnCount = componentVulnerabilityRepository.countBySbomId(sbom.getId());
            map.put("vulnerabilityCount", vulnCount);
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", sbomDtos);
        response.put("page", sbomPage.getNumber());
        response.put("totalPages", sbomPage.getTotalPages());
        response.put("totalElements", sbomPage.getTotalElements());

        return ResponseEntity.ok(response);
    }

    @PostMapping("/repositories/{repositoryId}/generate")
    public ResponseEntity<?> generateSbomForCommit(
        @PathVariable Long repositoryId,
        @RequestParam String commitSha,
        Principal principal
    ) {
        try {
            // 1. Fetch repository
            Repository repo = repositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

            // 2. Fetch commit info from GitHub
            String owner = repo.getOwner();
            String name = repo.getName();
            String githubToken = null;
            if (principal != null) {
                githubToken = userService.getCurrentUser().getGithubToken();
            }
            Map<String, Object> commitInfo = gitHubIntegrationService.getRepositoryCommit(owner, name, commitSha, githubToken);
            String commitMessage = (String) ((Map<String, Object>)commitInfo.get("commit")).get("message");
            String commitAuthor = (String) ((Map<String, Object>)((Map<String, Object>)commitInfo.get("commit")).get("author")).get("name");
            String commitDate = (String) ((Map<String, Object>)((Map<String, Object>)commitInfo.get("commit")).get("author")).get("date");

            // 3. Clone repo at commit
            String tempDir = System.getProperty("java.io.tmpdir") + "/repo-" + repositoryId + "-" + commitSha;
            String cloneUrl = repo.getHtmlUrl().replace("https://", "https://" + githubToken + "@");
            Process cloneProcess = new ProcessBuilder(
                "git", "clone", cloneUrl, tempDir
            ).inheritIO().start();
            int cloneExit = cloneProcess.waitFor();
            if (cloneExit != 0) {
                throw new RuntimeException("Failed to clone repository");
            }
            Process checkoutProcess = new ProcessBuilder(
                "git", "checkout", commitSha
            ).directory(new java.io.File(tempDir)).inheritIO().start();
            int checkoutExit = checkoutProcess.waitFor();
            if (checkoutExit != 0) {
                throw new RuntimeException("Failed to checkout commit");
            }

            // 4. Run cdxgen
            String sbomPath = tempDir + "/sbom.json";
            Process cdxgenProcess = new ProcessBuilder(
                cdxgenPath, tempDir, "-o", sbomPath
            ).inheritIO().start();
            int cdxgenExit = cdxgenProcess.waitFor();
            if (cdxgenExit != 0) {
                throw new RuntimeException("cdxgen failed");
            }
            String sbomJson = Files.readString(Paths.get(sbomPath));

            // 5. Store SBOM with commit info
            SBOMUploadResponse response = sbomProcessingService.processSBOMData(
                objectMapper.readValue(sbomJson, CycloneDxBomDto.class),
                repo.getName(),
                principal != null ? principal.getName() : "system",
                repositoryId
            );
            // Update SBOM with commit info
            Sbom sbom = sbomRepository.findById(response.getSbomId()).orElseThrow();
            sbom.setCommitSha(commitSha);
            sbom.setCommitMessage(commitMessage);
            sbom.setCommitAuthor(commitAuthor);
            repo.addSbom(sbom);
            sbomRepository.save(sbom);
            repositoryRepository.save(repo);

            // 6. Clean up temp dir
            try { Files.walk(Paths.get(tempDir)).sorted((a, b) -> b.compareTo(a)).forEach(p -> p.toFile().delete()); } catch (Exception ignore) {}

        return ResponseEntity.ok(Map.of(
                "status", "success",
                "sbomId", sbom.getId(),
                "commitSha", commitSha,
                "commitMessage", commitMessage,
                "commitAuthor", commitAuthor
            ));
        } catch (Exception e) {
            log.error("Error generating SBOM for commit: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/repositories/{repositoryId}/vuln-history")
    public ResponseEntity<?> getVulnHistory(
        @PathVariable Long repositoryId
    ) {
        List<Sbom> sboms = sbomRepository.findByRepositoryId(repositoryId);
        List<Map<String, Object>> history = sboms.stream().map(sbom -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("commitSha", sbom.getCommitSha());
            map.put("commitMessage", sbom.getCommitMessage());
            map.put("commitAuthor", sbom.getCommitAuthor());
            map.put("createdAt", sbom.getCreatedAt());
            int vulnCount = componentVulnerabilityRepository.countBySbomId(sbom.getId());
            map.put("vulnerabilityCount", vulnCount);
            return map;
        }).collect(Collectors.toList());
        return ResponseEntity.ok(history);
    }

    @GetMapping("/repositories/{repositoryId}/sbom/{sbomId}/components")
    public ResponseEntity<?> getSbomComponentsForRepository(
        @PathVariable Long repositoryId,
        @PathVariable Long sbomId
    ) {
        log.info("=== SBOM Components Request Started ===");
        log.info("Repository ID: {}, SBOM ID: {}", repositoryId, sbomId);
        
        try {
            // Validate repository exists
            var repository = repositoryRepository.findById(repositoryId);
            if (repository.isEmpty()) {
                log.error("Repository not found with ID: {}", repositoryId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "Repository not found"));
            }
            log.info("Repository found: {}", repository.get().getName());
            
            // Validate SBOM exists
            var sbom = sbomRepository.findById(sbomId);
            if (sbom.isEmpty()) {
                log.error("SBOM not found with ID: {}", sbomId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "SBOM not found"));
            }
            log.info("SBOM found: ID={}, Format={}, Version={}", 
                sbom.get().getId(), sbom.get().getBomFormat(), sbom.get().getSpecVersion());
            
            // Validate SBOM belongs to repository
            if (sbom.get().getRepository() == null) {
                log.error("SBOM {} is not linked to any repository", sbomId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "SBOM is not linked to any repository"));
            }
            
            if (!sbom.get().getRepository().getId().equals(repositoryId)) {
                log.error("SBOM {} belongs to repository {} but requested for repository {}", 
                    sbomId, sbom.get().getRepository().getId(), repositoryId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(Map.of("error", "SBOM not found for this repository"));
            }
            
            // Validate SBOM content
            if (sbom.get().getContent() == null) {
                log.error("SBOM content is null for sbomId={}", sbomId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "SBOM content is null"));
            }
            
            String content = new String(sbom.get().getContent(), StandardCharsets.UTF_8);
            if (content.trim().isEmpty()) {
                log.error("SBOM content is empty for sbomId={}", sbomId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "SBOM content is empty"));
            }
            
            // Parse SBOM content
            CycloneDxBomDto sbomDto;
            try {
                sbomDto = objectMapper.readValue(content, CycloneDxBomDto.class);
                log.info("Successfully parsed SBOM JSON for sbomId={}", sbomId);
            } catch (Exception e) {
                log.error("Failed to parse SBOM JSON for sbomId={}: {}", sbomId, e.getMessage());
                return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid SBOM JSON: " + e.getMessage()));
            }
            
            // Get top 5 components
            List<ComponentDto> allComponents = (sbomDto != null && sbomDto.getComponents() != null) 
                ? sbomDto.getComponents() 
                : List.of();
            List<ComponentDto> topComponents = allComponents.stream()
                .limit(5)
                .collect(Collectors.toList());
            log.info("Returning top {} components from total {} components", topComponents.size(), allComponents.size());
            
            // Calculate summary
            int totalComponents = allComponents.size();
            int vulnerableComponents = 0;
            Map<String, Integer> bySeverity = new HashMap<>();
            bySeverity.put("critical", 0);
            bySeverity.put("high", 0);
            bySeverity.put("medium", 0);
            bySeverity.put("low", 0);
            bySeverity.put("safe", 0);
            bySeverity.put("unknown", 0);
            
            for (ComponentDto comp : allComponents) {
                boolean isVulnerable = false;
                if (comp.getVulnerabilities() != null && !comp.getVulnerabilities().isEmpty()) {
                    isVulnerable = true;
                    for (var vuln : comp.getVulnerabilities()) {
                        String sev = "unknown";
                        if (vuln.getRatings() != null && !vuln.getRatings().isEmpty() 
                            && vuln.getRatings().get(0).getSeverity() != null) {
                            sev = vuln.getRatings().get(0).getSeverity().toLowerCase();
                        }
                        bySeverity.put(sev, bySeverity.getOrDefault(sev, 0) + 1);
                    }
                } else {
                    bySeverity.put("safe", bySeverity.get("safe") + 1);
                }
                if (isVulnerable) vulnerableComponents++;
            }
            
            Map<String, Object> response = new HashMap<>();
            response.put("components", topComponents);
            Map<String, Object> summary = new HashMap<>();
            summary.put("totalComponents", totalComponents);
            summary.put("vulnerableComponents", vulnerableComponents);
            summary.put("bySeverity", bySeverity);
            response.put("summary", summary);
            
            log.info("Successfully processed SBOM {} with {} components ({} vulnerable)", 
                sbomId, totalComponents, vulnerableComponents);
            log.info("=== SBOM Components Request Completed ===");
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("=== SBOM Components Request Failed ===");
            log.error("Error retrieving SBOM components: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of("error", "Internal server error: " + e.getMessage()));
        }
    }

    @GetMapping("/repositories/{repositoryId}/commits")
    public ResponseEntity<?> getRepositoryCommits(@PathVariable Long repositoryId, Principal principal) {
        Repository repo = repositoryRepository.findById(repositoryId).orElse(null);
        if (repo == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Repository not found"));
        }
        String owner = repo.getOwner();
        String name = repo.getName();
        String username = principal != null ? principal.getName() : null;
        try {
            // Fetch commits from GitHubIntegrationService
            var commits = gitHubIntegrationService.getRepositoryCommits(owner, name, repo.getDefaultBranch(), username);
            // Map to a simple structure
            var commitList = commits.stream().map(commit -> Map.of(
                "sha", commit.get("sha"),
                "message", ((Map<String, Object>)commit.get("commit")).get("message"),
                "author", ((Map<String, Object>)((Map<String, Object>)commit.get("commit")).get("author")).get("name"),
                "date", ((Map<String, Object>)((Map<String, Object>)commit.get("commit")).get("author")).get("date")
            )).toList();
            return ResponseEntity.ok(commitList);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/repositories/{repositoryId}/sbom/{sbomId}/graph")
    public ResponseEntity<?> getSbomGraph(
        @PathVariable Long repositoryId,
        @PathVariable Long sbomId
    ) {
        try {
            System.out.println("================================================================");
            System.out.println("                 STARTING GRAPH DATA GENERATION                   ");
            System.out.println("================================================================");
            System.out.println("Repository ID: " + repositoryId);
            System.out.println("SBOM ID: " + sbomId);
            
            // Get repository and verify it exists
            Repository repository = repositoryRepository.findById(repositoryId)
                .orElseThrow(() -> {
                    String error = "Repository not found with id: " + repositoryId;
                    System.err.println(error);
                    return new NotFoundException(error);
                });
            System.out.println("Repository found: " + repository.getName() + " (ID: " + repository.getId() + ")");
            
            // Get SBOM and verify it exists
            Sbom sbom = sbomRepository.findById(sbomId)
                .orElseThrow(() -> {
                    String error = "SBOM not found with id: " + sbomId;
                    System.err.println(error);
                    return new NotFoundException(error);
                });
            System.out.println("SBOM found: " + sbom.getId() + " (Format: " + sbom.getBomFormat() + ", Version: " + sbom.getSpecVersion() + ")");
            
            System.out.println("----------------------------------------------------------------");
            System.out.println("                    GENERATING GRAPH DATA                        ");
            System.out.println("----------------------------------------------------------------");

            // Get graph data
            GraphDataResponse graphData = graphDataService.getGraphDataForSbom(sbomId);
            
            // Log summary information
            System.out.println("Graph Generation Summary:");
            System.out.println("- Total Nodes: " + graphData.getNodes().size());
            System.out.println("- Total Links: " + graphData.getLinks().size());
            
            long vulnerableNodes = graphData.getNodes().stream()
                    .filter(n -> n.getVulnerabilityInfos() != null && !n.getVulnerabilityInfos().isEmpty())
                .count();
            System.out.println("- Vulnerable Nodes: " + vulnerableNodes);
            
            // Log risk level distribution
            Map<String, Long> riskDistribution = graphData.getNodes().stream()
                .collect(Collectors.groupingBy(
                    n -> n.getRiskLevel(),
                    Collectors.counting()
                ));
            System.out.println("Risk Level Distribution:");
            riskDistribution.forEach((risk, count) -> 
                System.out.println("- " + risk.toUpperCase() + ": " + count));
            
            System.out.println("================================================================");
            System.out.println("              GRAPH DATA GENERATION COMPLETED                    ");
            System.out.println("================================================================");

            return ResponseEntity.ok(graphData);
        } catch (Exception e) {
            System.err.println("================================================================");
            System.err.println("                    GRAPH GENERATION ERROR                       ");
            System.err.println("================================================================");
            System.err.println("Failed to generate graph for SBOM " + sbomId + " in repository " + repositoryId);
            System.err.println("Error details: " + e.getMessage());
            e.printStackTrace(System.err);
            System.err.println("================================================================");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Internal server error: " + e.getMessage(),
                    "details", e.getClass().getSimpleName()
                ));
        }
    }

    @GetMapping("/dashboard/projects/{projectId}/repositories")
    public ResponseEntity<?> getConnectedRepositories(@PathVariable Long projectId) {
        try {
            System.out.println("================================================================");
            System.out.println("            FETCHING CONNECTED REPOSITORIES                      ");
            System.out.println("================================================================");
            System.out.println("Project ID: " + projectId);
            
            List<Repository> repositories = repositoryRepository.findByProjectId(projectId);
            System.out.println("Found " + repositories.size() + " connected repositories");
            
            List<Map<String, Object>> response = repositories.stream()
                .map(repo -> {
                    Map<String, Object> repoData = new HashMap<>();
                    repoData.put("id", repo.getId());
                    repoData.put("name", repo.getName());
                    repoData.put("description", repo.getDescription());
                    repoData.put("defaultBranch", repo.getDefaultBranch());
                    
                    // Get latest SBOM if exists
                    Sbom latestSbom = sbomRepository.findFirstByRepositoryIdOrderByCreatedAtDesc(repo.getId())
                        .orElse(null);
                    if (latestSbom != null) {
                        repoData.put("latestSbomId", latestSbom.getId());
                        repoData.put("lastScanAt", latestSbom.getCreatedAt());
                        
                        // Get vulnerability count
                        int vulnCount = componentVulnerabilityRepository.countBySbomId(latestSbom.getId());
                        repoData.put("vulnerabilityCount", vulnCount);
                    }
                    
                    return repoData;
                })
                .collect(Collectors.toList());
            
            System.out.println("Successfully prepared response with " + response.size() + " repositories");
            System.out.println("================================================================");
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("================================================================");
            System.err.println("            ERROR FETCHING CONNECTED REPOSITORIES                ");
            System.err.println("================================================================");
            System.err.println("Failed to fetch repositories for project: " + projectId);
            System.err.println("Error details: " + e.getMessage());
            e.printStackTrace(System.err);
            System.err.println("================================================================");
            
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(Map.of(
                    "error", "Failed to fetch connected repositories: " + e.getMessage(),
                    "details", e.getClass().getSimpleName()
                ));
        }
    }
} 
