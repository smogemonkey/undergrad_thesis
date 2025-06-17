package com.vulnview.service.impl;

import com.vulnview.entity.Repository;
import com.vulnview.entity.User;
import com.vulnview.entity.Project;
import com.vulnview.entity.Component;
import com.vulnview.entity.Vulnerability;
import com.vulnview.entity.ComponentVulnerability;
import com.vulnview.entity.RiskLevel;
import com.vulnview.entity.Sbom;
import com.vulnview.repository.RepositoryRepository;
import com.vulnview.repository.UserRepository;
import com.vulnview.repository.ProjectRepository;
import com.vulnview.repository.ComponentRepository;
import com.vulnview.repository.VulnerabilityRepository;
import com.vulnview.repository.ComponentVulnerabilityRepository;
import com.vulnview.repository.SbomRepository;
import com.vulnview.service.GitHubIntegrationService;
import com.vulnview.service.SBOMProcessingService;
import com.vulnview.dto.SBOMUploadResponse;
import com.vulnview.dto.sbom.CycloneDxBomDto;
import com.vulnview.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
public class GitHubIntegrationServiceImpl implements GitHubIntegrationService {

    private final UserRepository userRepository;
    private final RepositoryRepository repositoryRepository;
    private final ProjectRepository projectRepository;
    private final RestTemplate restTemplate;
    private final ComponentRepository componentRepository;
    private final VulnerabilityRepository vulnerabilityRepository;
    private final ComponentVulnerabilityRepository componentVulnerabilityRepository;
    private final SbomRepository sbomRepository;
    private final ObjectMapper objectMapper;
    private final SBOMProcessingService sbomProcessingService;
    private static final Logger log = LoggerFactory.getLogger(GitHubIntegrationServiceImpl.class);

    @Value("${github.client.id}")
    private String clientId;

    @Value("${github.client.secret}")
    private String clientSecret;

    @Value("${github.redirect.uri}")
    private String redirectUri;

    @Override
    public Map<String, String> connectGitHubAccount(String code, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        // Exchange code for access token
        String token = exchangeCodeForToken(code);
        
        // Get GitHub user info
        Map<String, Object> userInfo = getUserInfo(token);
        String githubUsername = (String) userInfo.get("login");

        // Update user with GitHub info
        user.setGithubUsername(githubUsername);
        user.setGithubToken(token);
        userRepository.save(user);

        return Map.of(
            "githubUsername", githubUsername,
            "message", "Successfully connected GitHub account"
        );
    }

    @Override
    public List<Map<String, Object>> listUserRepositories(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getGithubToken() == null) {
            throw new RuntimeException("GitHub account not connected");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(user.getGithubToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);

        String url = "https://api.github.com/user/repos";
        List<Map<String, Object>> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            entity,
            List.class
        ).getBody();

        return response != null ? response : new ArrayList<>();
    }

    @Override
    @Transactional
    public Repository connectRepository(String owner, String repo, Long projectId, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found"));

        if (user.getGithubToken() == null) {
            throw new RuntimeException("GitHub account not connected");
        }

        // Check if repository already exists in this project
        boolean repoExists = repositoryRepository.findByOwnerAndNameAndProject(owner, repo, project).isPresent();
        if (repoExists) {
            throw new RuntimeException("This repository is already connected to this project");
        }

        // Verify repository access
        if (!verifyRepositoryAccess(owner, repo, user.getGithubToken())) {
            throw new RuntimeException("No access to repository");
        }

        // Get repository details
        Map<String, Object> repoDetails = getRepositoryDetails(owner, repo, user.getGithubToken());

        if (repoDetails == null) {
            throw new RuntimeException("Failed to get repository details");
        }

        // Create repository entity with default values
        Repository repository = new Repository();
        repository.setName(repo);
        repository.setOwner(owner);
        repository.setHtmlUrl((String) repoDetails.getOrDefault("html_url", ""));
        repository.setUrl((String) repoDetails.getOrDefault("url", ""));
        repository.setDefaultBranch((String) repoDetails.getOrDefault("default_branch", "main"));
        repository.setDescription((String) repoDetails.getOrDefault("description", ""));
        repository.setIsPrivate((Boolean) repoDetails.getOrDefault("private", false));
        repository.setFork((Boolean) repoDetails.getOrDefault("fork", false));
        repository.setForksCount((Integer) repoDetails.getOrDefault("forks_count", 0));
        repository.setStarsCount((Integer) repoDetails.getOrDefault("stargazers_count", 0));
        repository.setWatchersCount((Integer) repoDetails.getOrDefault("watchers_count", 0));
        repository.setOpenIssuesCount((Integer) repoDetails.getOrDefault("open_issues_count", 0));
        repository.setGithubRepoId(((Number) repoDetails.getOrDefault("id", 0)).longValue());
        repository.setCreatedAt(LocalDateTime.now().toString());
        repository.setUpdatedAt(LocalDateTime.now().toString());
        repository.setPushedAt(LocalDateTime.now().toString());
        repository.setLastSync(null);
        repository.setLastSnykScan(null);
        repository.setSbomJson(null);
        repository.setSnykResults(null);
        repository.setLocalPath(null);
        repository.setUser(user);
        repository.setProject(project);

        return repositoryRepository.save(repository);
    }

    @Override
    @Transactional
    public Map<String, Object> syncRepository(Long repositoryId, String username) {
        log.info("🔄 Starting repository sync for ID: {} and user: {}", repositoryId, username);
        
        try {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        Repository repository = repositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));

        if (user.getGithubToken() == null) {
                log.error("❌ GitHub token not found for user: {}", username);
            throw new RuntimeException("GitHub account not connected");
        }

            log.info("📡 Fetching repository details from GitHub");
            Map<String, Object> repoDetails = getRepositoryDetails(
                repository.getOwner(),
                repository.getName(),
                user.getGithubToken()
            );

            // Update repository details with default values
            log.info("📝 Updating repository details in database");
            repository.setDescription((String) repoDetails.getOrDefault("description", ""));
            repository.setDefaultBranch((String) repoDetails.getOrDefault("default_branch", "main"));
            repository.setHtmlUrl((String) repoDetails.getOrDefault("html_url", ""));
            repository.setUrl((String) repoDetails.getOrDefault("url", ""));
            repository.setIsPrivate((Boolean) repoDetails.getOrDefault("private", false));
            repository.setFork((Boolean) repoDetails.getOrDefault("fork", false));
            repository.setForksCount((Integer) repoDetails.getOrDefault("forks_count", 0));
            repository.setStarsCount((Integer) repoDetails.getOrDefault("stargazers_count", 0));
            repository.setWatchersCount((Integer) repoDetails.getOrDefault("watchers_count", 0));
            repository.setOpenIssuesCount((Integer) repoDetails.getOrDefault("open_issues_count", 0));
            repository.setGithubRepoId(((Number) repoDetails.getOrDefault("id", 0)).longValue());
            repository.setUpdatedAt(LocalDateTime.now().toString());
            repository.setLastSync(LocalDateTime.now());
            repository = repositoryRepository.save(repository);
            log.info("✅ Repository details updated successfully");

            // Clone repository
            String cloneUrl = (String) repoDetails.get("clone_url");
            String branch = repository.getDefaultBranch();
            String tempDir = System.getProperty("java.io.tmpdir") + "/repo-" + repository.getId() + "-" + System.currentTimeMillis();
            log.info("📥 Cloning repository {} to temporary directory: {}", cloneUrl, tempDir);

            // Add token to clone URL if private repository
            if (repository.getIsPrivate()) {
                cloneUrl = cloneUrl.replace("https://", "https://" + user.getGithubToken() + "@");
            }

            Process cloneProcess = new ProcessBuilder(
                "git", "clone", "--branch", branch, "--single-branch", cloneUrl, tempDir
            ).inheritIO().start();
            
            int cloneExit = cloneProcess.waitFor();
            if (cloneExit != 0) {
                log.error("❌ Failed to clone repository. Exit code: {}", cloneExit);
                throw new RuntimeException("Failed to clone repository");
            }
            log.info("✅ Repository cloned successfully");

            // Save the repository path
            repository.setLocalPath(tempDir);
            repository = repositoryRepository.save(repository);
            log.info("✅ Saved repository local path: {}", tempDir);

            // Generate SBOM using cdxgen
            log.info("📊 Generating SBOM using cdxgen");
            String sbomPath = tempDir + "/sbom.json";
            Process cdxgenProcess = new ProcessBuilder(
                "cdxgen", tempDir, "-o", sbomPath
            ).inheritIO().start();
            int cdxgenExit = cdxgenProcess.waitFor();
            if (cdxgenExit != 0) {
                log.error("❌ Failed to generate SBOM. Exit code: {}", cdxgenExit);
                throw new RuntimeException("cdxgen failed");
            }
            log.info("✅ SBOM generated successfully");

            // Upload SBOM using the upload endpoint
            log.info("📤 Uploading SBOM to server");
            String sbomJson = Files.readString(Paths.get(sbomPath));
            log.info("📄 Read SBOM content, size: {} bytes", sbomJson.length());
            
            CycloneDxBomDto sbomDto = objectMapper.readValue(sbomJson, CycloneDxBomDto.class);
            
            // Process SBOM directly using the service
            log.info("🔄 Processing SBOM data");
            SBOMUploadResponse response = sbomProcessingService.processSBOMData(
                sbomDto,
                repository.getName(),
                user.getUsername(),
                repository.getId()
            );
            
            if (!"SUCCESS".equals(response.getStatus())) {
                throw new RuntimeException("Failed to process SBOM: " + response.getMessage());
            }
            
            log.info("✅ SBOM processed successfully with ID: {}", response.getSbomId());

            // Return results with sbomId
            Map<String, Object> result = new HashMap<>();
            result.put("status", "success");
            result.put("message", String.format("Repository sync completed. Processed %d components.", response.getTotalComponents()));
            result.put("repositoryId", repository.getId());
            result.put("componentsFound", response.getTotalComponents());
            result.put("sbomId", response.getSbomId());
            log.info("✅ Repository sync completed successfully. Found {} components", response.getTotalComponents());
            return result;

        } catch (Exception e) {
            log.error("❌ Failed to sync repository: {}", e.getMessage(), e);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("status", "error");
            errorResult.put("message", "Failed to sync repository: " + e.getMessage());
            return errorResult;
        }
    }

    @Override
    public List<Map<String, Object>> getRepositoryBranches(String owner, String repo, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getGithubToken() == null) {
            throw new RuntimeException("GitHub account not connected");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(user.getGithubToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);

        String url = String.format("https://api.github.com/repos/%s/%s/branches", owner, repo);
        List<Map<String, Object>> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            entity,
            List.class
        ).getBody();

        return response != null ? response : new ArrayList<>();
    }

    @Override
    public List<Map<String, Object>> getRepositoryCommits(String owner, String repo, String branch, String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (user.getGithubToken() == null) {
            throw new RuntimeException("GitHub account not connected");
        }

        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(user.getGithubToken());
        HttpEntity<?> entity = new HttpEntity<>(headers);

        String url = String.format("https://api.github.com/repos/%s/%s/commits?sha=%s", owner, repo, branch);
        List<Map<String, Object>> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            entity,
            List.class
        ).getBody();

        return response != null ? response : new ArrayList<>();
    }

    @Override
    public boolean verifyRepositoryAccess(String owner, String repo, String token) {
        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            HttpEntity<?> entity = new HttpEntity<>(headers);

            String url = String.format("https://api.github.com/repos/%s/%s", owner, repo);
            restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                Map.class
            );
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String exchangeCodeForToken(String code) {
        String url = "https://github.com/login/oauth/access_token";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));

        Map<String, String> body = new HashMap<>();
        body.put("client_id", clientId);
        body.put("client_secret", clientSecret);
        body.put("code", code);
        body.put("redirect_uri", redirectUri);

        HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.POST,
                request,
                Map.class
            );

            // Log the response for debugging
            System.out.println("GitHub OAuth Response: " + response.getBody());

            if (response.getBody() == null) {
                throw new RuntimeException("Empty response from GitHub");
            }

            if (response.getBody().containsKey("error")) {
                String error = (String) response.getBody().get("error");
                String errorDescription = (String) response.getBody().get("error_description");
                throw new RuntimeException("GitHub OAuth error: " + error + " - " + errorDescription);
            }

            if (!response.getBody().containsKey("access_token")) {
                throw new RuntimeException("No access token in GitHub response");
            }

            return (String) response.getBody().get("access_token");
        } catch (HttpClientErrorException e) {
            System.err.println("GitHub OAuth error: " + e.getResponseBodyAsString());
            throw new RuntimeException("Failed to exchange code for token: " + e.getMessage());
        } catch (Exception e) {
            System.err.println("Unexpected error during token exchange: " + e.getMessage());
            throw new RuntimeException("Failed to exchange code for token: " + e.getMessage());
        }
    }

    @Override
    public Map<String, Object> getUserInfo(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        return restTemplate.exchange(
            "https://api.github.com/user",
            HttpMethod.GET,
            entity,
            Map.class
        ).getBody();
    }

    @Override
    public Map<String, Object> getRepositoryDetails(String owner, String repo, String token) {
        log.info("Making GitHub API request for repository: {}/{}", owner, repo);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        HttpEntity<?> entity = new HttpEntity<>(headers);

        String url = String.format("https://api.github.com/repos/%s/%s", owner, repo);
        log.info("GitHub API URL: {}", url);
        
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
            url,
            HttpMethod.GET,
            entity,
            Map.class
            );
            
            log.info("GitHub API Response Status: {}", response.getStatusCode());
            log.info("GitHub API Response Headers: {}", response.getHeaders());

            Map<String, Object> responseBody = response.getBody();
            if (responseBody == null) {
                log.error("Empty response body from GitHub API");
            throw new RuntimeException("Failed to get repository details");
        }

            log.info("Successfully retrieved repository details");
            return responseBody;
        } catch (HttpClientErrorException e) {
            log.error("GitHub API Error: {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Failed to get repository details: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error during GitHub API call: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get repository details: " + e.getMessage());
        }
    }

    private String normalizeComponentName(String packageName, String packageManager) {
        if (packageName.startsWith("pkg:" + packageManager + "/")) {
            // If it's already in PURL format, extract just the name
            String[] parts = packageName.split("/");
            return parts[parts.length - 1].split("@")[0];
        }
        return packageName;
    }

    @Override
    @Transactional
    public Map<String, Object> getRepositorySbom(Long repositoryId, String username) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("Starting vulnerability scan for repository ID: {}", repositoryId);
            
            final Repository repository = repositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Repository not found"));
            log.info("Found repository: {} (owner: {})", repository.getName(), repository.getOwner());
            
            // Create SBOM if it doesn't exist
            if (repository.getSbom() == null) {
                log.info("No SBOM found for repository. Creating new SBOM...");
                Sbom newSbom = Sbom.builder()
                    .repository(repository)
                    .version("1.0")
                    .bomFormat("CycloneDX")
                    .specVersion("1.4")
                    .serialNumber("urn:uuid:" + UUID.randomUUID().toString())
                    .commitSha("initial")
                    .commitMessage("Initial SBOM creation")
                    .commitAuthor(username)
                    .components(new HashSet<>())
                    .dependencies(new HashSet<>())
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();
                
                log.info("Saving new SBOM...");
                sbomRepository.save(newSbom);
                repository.setSbom(newSbom);
                repositoryRepository.save(repository);
                log.info("New SBOM created with ID: {}", newSbom.getId());
            }

            // Run Snyk scan directly on the repository
            final String tempDir = System.getProperty("java.io.tmpdir") + "/repo-" + repository.getId() + "-" + System.currentTimeMillis();
            log.info("Starting Snyk scan in directory: {}", tempDir);

            // Clone repository first
            try {
                log.info("Cloning repository to temporary directory...");
                Process cloneProcess = new ProcessBuilder(
                    "git", "clone", repository.getHtmlUrl(), tempDir
                ).start();
                
                StringBuilder cloneError = new StringBuilder();
                try (java.io.BufferedReader errReader = new java.io.BufferedReader(
                        new java.io.InputStreamReader(cloneProcess.getErrorStream()))) {
                    String line;
                    while ((line = errReader.readLine()) != null) {
                        cloneError.append(line).append("\n");
                    }
                }
                
                int cloneExit = cloneProcess.waitFor();
                if (cloneExit != 0) {
                    log.error("Failed to clone repository. Exit code: {}. Error: {}", cloneExit, cloneError.toString());
                    throw new RuntimeException("Failed to clone repository: " + cloneError.toString());
                }
                log.info("Repository cloned successfully");
            } catch (Exception e) {
                log.error("Error during repository cloning: {}", e.getMessage(), e);
                throw new RuntimeException("Failed to clone repository: " + e.getMessage());
            }

            log.info("Running Snyk scan...");
            Process snykProcess = new ProcessBuilder(
                "snyk", "test", "--json", "--all-projects", tempDir
            ).start();

            StringBuilder output = new StringBuilder();
            StringBuilder errorOutput = new StringBuilder();
            
            try (
                java.io.BufferedReader stdReader = new java.io.BufferedReader(new java.io.InputStreamReader(snykProcess.getInputStream()));
                java.io.BufferedReader errReader = new java.io.BufferedReader(new java.io.InputStreamReader(snykProcess.getErrorStream()))
            ) {
                String line;
                while ((line = stdReader.readLine()) != null) {
                    output.append(line).append("\n");
                    log.debug("Snyk output: {}", line);
                }
                while ((line = errReader.readLine()) != null) {
                    errorOutput.append(line).append("\n");
                    log.warn("Snyk scan warning: {}", line);
                }
            }

            int snykExit = snykProcess.waitFor();
            log.info("Snyk scan completed with exit code: {}", snykExit);
            
            if (snykExit != 0 && snykExit != 1) { // Exit code 1 means vulnerabilities found
                log.error("Snyk scan failed with exit code: {}. Error output: {}", snykExit, errorOutput);
                throw new RuntimeException("Snyk scan failed with exit code: " + snykExit);
            }

            String snykResults = output.toString();
            log.info("Parsing Snyk scan results...");
            log.debug("Raw Snyk results: {}", snykResults);
            
            JsonNode root = objectMapper.readTree(snykResults);
            JsonNode vulns = root.get("vulnerabilities");
            
            if (vulns == null || !vulns.isArray()) {
                log.warn("No vulnerabilities array found in scan results. Root node fields: {}", 
                    root.fieldNames().toString());
                return Map.of(
                    "status", "success",
                    "message", "No vulnerabilities found",
                    "repositoryId", repository.getId()
                );
            }

            log.info("Found {} potential vulnerabilities to process", vulns.size());
            Map<String, Component> components = new HashMap<>();
            int processedVulns = 0;
            
            for (JsonNode vuln : vulns) {
                try {
                    final String rawPackageName = vuln.path("packageName").asText();
                    final String packageManager = vuln.path("packageManager").asText().toLowerCase();
                    final String normalizedPackageName = normalizeComponentName(rawPackageName, packageManager);
                    final String version = vuln.path("version").asText();
                    final String severity = vuln.path("severity").asText();
                    final double cvssScore = vuln.path("cvssScore").asDouble();
                    
                    log.debug("Processing vulnerability - Package: {}@{}, Severity: {}, CVSS: {}", 
                        normalizedPackageName, version, severity, cvssScore);
                    
                    // Get CVE ID
                    final String cveId = getCveId(vuln);
                    log.debug("Found CVE ID: {}", cveId);
                    
                    // Create or get component
                    final String componentKey = normalizedPackageName + "@" + version;
                    log.debug("Looking for existing component with key: {}", componentKey);

                    // Try to find component by normalized name first
                    Optional<Component> existingComponent = componentRepository.findByNameAndVersionAndSbomId(
                        normalizedPackageName, version, repository.getSbom().getId());

                    // If not found, try with full PURL format
                    if (existingComponent.isEmpty()) {
                        String purlFormat = String.format("pkg:%s/%s@%s", 
                            packageManager, normalizedPackageName, version);
                        log.debug("Component not found with normalized name, trying PURL format: {}", purlFormat);
                        existingComponent = componentRepository.findByNameAndVersionAndSbomId(
                            purlFormat, version, repository.getSbom().getId());
                    }

                    Component component = existingComponent.orElseGet(() -> {
                        log.debug("Creating new component: {}", componentKey);
                        Component newComponent = Component.builder()
                            .name(normalizedPackageName)
                            .version(version)
                            .type(packageManager)
                            .packageUrl(String.format("pkg:%s/%s@%s", 
                                packageManager, normalizedPackageName, version))
                            .sbom(repository.getSbom())
                            .build();
                        return componentRepository.save(newComponent);
                    });
                    
                    // Create vulnerability
                    final String vulnId = cveId != null ? cveId : vuln.path("id").asText();
                    final String description = vuln.path("description").asText();
                    final String cvssVector = vuln.path("CVSSv3").asText();
                    
                    log.debug("Processing vulnerability ID: {}", vulnId);
                    
                    Vulnerability vulnerability = vulnerabilityRepository.findByCveId(vulnId)
                        .orElseGet(() -> {
                            log.debug("Creating new vulnerability: {}", vulnId);
                            Vulnerability newVuln = Vulnerability.builder()
                                .cveId(vulnId)
                                .severity(severity)
                                .cvssScore(cvssScore)
                                .cvssVector(cvssVector)
                                .description(description)
                                .riskLevel(getRiskLevel(cvssScore, severity))
                                .componentVulnerabilities(new HashSet<>())
                                .build();
                            return vulnerabilityRepository.save(newVuln);
                        });
                    
                    // Create or update component-vulnerability relationship
                    log.debug("Creating/updating component-vulnerability relationship");
                    ComponentVulnerability cv = componentVulnerabilityRepository
                        .findByComponentAndVulnerability(component, vulnerability)
                        .orElseGet(() -> ComponentVulnerability.builder()
                            .component(component)
                            .vulnerability(vulnerability)
                            .severity(severity)
                            .score(cvssScore)
                            .cve(vulnId)
                            .description(description)
                            .cvssVector(cvssVector)
                            .sbom(repository.getSbom())
                            .build());
                    
                    componentVulnerabilityRepository.save(cv);
                    
                    // Update component's risk level if necessary
                    RiskLevel newRiskLevel = getRiskLevel(cvssScore, severity);
                    if (component.getRiskLevel() == null || 
                        newRiskLevel.ordinal() > component.getRiskLevel().ordinal()) {
                        log.debug("Updating component risk level to: {}", newRiskLevel);
                        component.setRiskLevel(newRiskLevel);
                        componentRepository.save(component);
                    }
                    
                    processedVulns++;
                    log.debug("Successfully processed vulnerability {} of {}", processedVulns, vulns.size());
                } catch (Exception e) {
                    log.error("Error processing vulnerability: {}", e.getMessage(), e);
                }
            }

            // Clean up temp directory
            try {
                log.info("Cleaning up temporary directory: {}", tempDir);
                java.nio.file.Files.walk(java.nio.file.Paths.get(tempDir))
                    .sorted(java.util.Comparator.reverseOrder())
                    .map(java.nio.file.Path::toFile)
                    .forEach(java.io.File::delete);
            } catch (Exception e) {
                log.warn("Error cleaning up temporary directory: {}", e.getMessage());
            }

            log.info("Successfully processed {}/{} vulnerabilities", processedVulns, vulns.size());
            
            response.put("status", "success");
            response.put("message", String.format("Processed %d vulnerabilities", processedVulns));
            response.put("repositoryId", repository.getId());
            response.put("vulnerabilitiesFound", processedVulns);
            
            return response;
        } catch (Exception e) {
            log.error("Error processing repository vulnerabilities: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", e.getMessage());
            return response;
        }
    }

    private String getCveId(JsonNode vuln) {
        JsonNode identifiers = vuln.path("identifiers");
        if (identifiers.has("CVE") && identifiers.get("CVE").isArray() && identifiers.get("CVE").size() > 0) {
            return identifiers.get("CVE").get(0).asText();
        }
        return null;
    }

    private RiskLevel getRiskLevel(double cvssScore, String severity) {
        // First check CVSS score
        if (cvssScore >= 9.0) return RiskLevel.CRITICAL;
        if (cvssScore >= 7.0) return RiskLevel.HIGH;
        if (cvssScore >= 4.0) return RiskLevel.MEDIUM;
        if (cvssScore > 0.0) return RiskLevel.LOW;
        
        // If no CVSS score, use severity
        if (severity != null) {
            switch (severity.toLowerCase()) {
                case "critical": return RiskLevel.CRITICAL;
                case "high": return RiskLevel.HIGH;
                case "medium": return RiskLevel.MEDIUM;
                case "low": return RiskLevel.LOW;
                default: return RiskLevel.NONE;
            }
        }
        
        return RiskLevel.NONE;
    }

    @Override
    public Repository getRepositoryById(Long repositoryId) {
        return repositoryRepository.findById(repositoryId)
                .orElseThrow(() -> new RuntimeException("Repository not found"));
    }

    @Override
    public Map<String, Object> getRepositoryCommit(String owner, String repo, String sha, String token) {
        String url = String.format("https://api.github.com/repos/%s/%s/commits/%s", owner, repo, sha);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setAccept(List.of(MediaType.APPLICATION_JSON));
        HttpEntity<?> entity = new HttpEntity<>(headers);
        try {
            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                entity,
                Map.class
            );
            return response.getBody();
        } catch (HttpClientErrorException e) {
            log.error("GitHub API Error (commit): {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new RuntimeException("Failed to get commit details: " + e.getMessage());
        } catch (Exception e) {
            log.error("Unexpected error during GitHub commit API call: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to get commit details: " + e.getMessage());
        }
    }

    @Transactional
    public void processSnykResults(Repository repository, JsonNode snykResults) {
        log.info("Starting to process Snyk results for repository: {}", repository.getName());
        
        if (repository.getSbom() == null) {
            log.warn("No SBOM found for repository: {}. Creating new SBOM.", repository.getName());
            Sbom newSbom = Sbom.builder()
                .repository(repository)
                .build();
            repository.setSbom(newSbom);
            log.info("Created new SBOM for repository: {}", repository.getName());
        }

        try {
            JsonNode vulns = snykResults.get("vulnerabilities");
            if (vulns == null || !vulns.isArray()) {
                log.warn("No vulnerabilities found in Snyk results or invalid format");
                return;
            }

            log.info("Found {} potential vulnerabilities to process", vulns.size());
            Map<String, Component> components = new HashMap<>();
            int processedVulns = 0;
            
            for (JsonNode vuln : vulns) {
                try {
                    final String rawPackageName = vuln.path("packageName").asText();
                    final String packageManager = vuln.path("packageManager").asText().toLowerCase();
                    final String normalizedPackageName = normalizeComponentName(rawPackageName, packageManager);
                    final String version = vuln.path("version").asText();
                    final String severity = vuln.path("severity").asText();
                    final double cvssScore = vuln.path("cvssScore").asDouble();
                    
                    log.info("Processing vulnerability - Package: {}@{}, Severity: {}, CVSS: {}", 
                        normalizedPackageName, version, severity, cvssScore);
                    
                    // Get CVE ID
                    final String cveId = getCveId(vuln);
                    log.info("Found CVE ID: {}", cveId);
                    
                    // Create or get component
                    final String componentKey = normalizedPackageName + "@" + version;
                    log.info("Looking for existing component with key: {}", componentKey);

                    // Try to find component by normalized name first
                    Optional<Component> existingComponent = componentRepository.findByNameAndVersionAndSbomId(
                        normalizedPackageName, version, repository.getSbom().getId());

                    log.info("Component search by normalized name result: {}", existingComponent.isPresent() ? "found" : "not found");

                    // If not found, try with full PURL format
                    if (existingComponent.isEmpty()) {
                        String purlFormat = String.format("pkg:%s/%s@%s", 
                            packageManager, normalizedPackageName, version);
                        log.info("Component not found with normalized name, trying PURL format: {}", purlFormat);
                        existingComponent = componentRepository.findByNameAndVersionAndSbomId(
                            purlFormat, version, repository.getSbom().getId());
                        log.info("Component search by PURL result: {}", existingComponent.isPresent() ? "found" : "not found");
                    }

                    Component component = existingComponent.orElseGet(() -> {
                        log.info("Creating new component: {}", componentKey);
                        Component newComponent = Component.builder()
                            .name(normalizedPackageName)
                            .version(version)
                            .type(packageManager)
                            .packageUrl(String.format("pkg:%s/%s@%s", 
                                packageManager, normalizedPackageName, version))
                            .sbom(repository.getSbom())
                            .build();
                        Component savedComponent = componentRepository.save(newComponent);
                        log.info("Created new component with ID: {}", savedComponent.getId());
                        return savedComponent;
                    });
                    
                    // Create vulnerability
                    final String vulnId = cveId != null ? cveId : vuln.path("id").asText();
                    final String description = vuln.path("description").asText();
                    final String cvssVector = vuln.path("CVSSv3").asText();
                    
                    log.info("Processing vulnerability ID: {}", vulnId);
                    
                    Vulnerability vulnerability = vulnerabilityRepository.findByCveId(vulnId)
                        .orElseGet(() -> {
                            log.info("Creating new vulnerability: {}", vulnId);
                            Vulnerability newVuln = Vulnerability.builder()
                                .cveId(vulnId)
                                .severity(severity)
                                .cvssScore(cvssScore)
                                .cvssVector(cvssVector)
                                .description(description)
                                .riskLevel(getRiskLevel(cvssScore, severity))
                                .componentVulnerabilities(new HashSet<>())
                                .build();
                            Vulnerability savedVuln = vulnerabilityRepository.save(newVuln);
                            log.info("Created new vulnerability with ID: {}", savedVuln.getId());
                            return savedVuln;
                        });
                    
                    // Create or update component-vulnerability relationship
                    log.info("Creating/updating component-vulnerability relationship");
                    ComponentVulnerability cv = componentVulnerabilityRepository
                        .findByComponentAndVulnerability(component, vulnerability)
                        .orElseGet(() -> {
                            log.info("Creating new component-vulnerability relationship");
                            ComponentVulnerability newCv = ComponentVulnerability.builder()
                                .component(component)
                                .vulnerability(vulnerability)
                                .severity(severity)
                                .score(cvssScore)
                                .cve(vulnId)
                                .description(description)
                                .cvssVector(cvssVector)
                                .sbom(repository.getSbom())
                                .build();
                            ComponentVulnerability savedCv = componentVulnerabilityRepository.save(newCv);
                            log.info("Created new component-vulnerability relationship with ID: {}", savedCv.getId());
                            return savedCv;
                        });
                    
                    componentVulnerabilityRepository.save(cv);
                    processedVulns++;
                    
                    // Update component's risk level if necessary
                    RiskLevel newRiskLevel = getRiskLevel(cvssScore, severity);
                    if (component.getRiskLevel() == null || 
                        component.getRiskLevel().ordinal() < newRiskLevel.ordinal()) {
                        log.info("Updating component {} risk level from {} to {}", 
                            component.getName(), 
                            component.getRiskLevel(), 
                            newRiskLevel);
                        component.setRiskLevel(newRiskLevel);
                        componentRepository.save(component);
                    }
                } catch (Exception e) {
                    log.error("Error processing vulnerability: {}", e.getMessage(), e);
                }
            }
            log.info("Completed processing {} out of {} vulnerabilities", processedVulns, vulns.size());
        } catch (Exception e) {
            log.error("Failed to process Snyk results: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to process Snyk results: " + e.getMessage());
        }
    }
} 