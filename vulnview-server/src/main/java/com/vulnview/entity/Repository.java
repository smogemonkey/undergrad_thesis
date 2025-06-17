package com.vulnview.entity;

import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.Map;
import java.util.HashMap;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.JsonNode;

@Entity
@Table(name = "repositories")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Repository {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String owner;

    @Column(nullable = false)
    private String url;

    @Column(name = "html_url")
    private String htmlUrl;

    @Column(name = "local_path")
    private String localPath;

    @Column(name = "description")
    private String description;

    @Column(name = "default_branch", nullable = false)
    private String defaultBranch;

    @Column(name = "last_sync")
    private LocalDateTime lastSync;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "github_repo_id")
    private Long githubRepoId;

    @Column(name = "is_private")
    private Boolean isPrivate;

    @Column(name = "is_fork")
    private boolean isFork;

    @Column(name = "stars_count")
    private Integer starsCount;

    @Column(name = "forks_count")
    private Integer forksCount;

    @Column(name = "watchers_count")
    private Integer watchersCount;

    @Column(name = "open_issues_count")
    private Integer openIssuesCount;

    @Column(name = "created_at")
    private String createdAt;

    @Column(name = "updated_at")
    private String updatedAt;

    @Column(name = "pushed_at")
    private String pushedAt;

    @OneToMany(mappedBy = "repository", cascade = CascadeType.ALL, orphanRemoval = true)
    private Set<Sbom> sboms = new HashSet<>();

    @Column(name = "sbom_json", columnDefinition = "TEXT")
    private String sbomJson;

    @Column(name = "snyk_results", columnDefinition = "TEXT")
    private String snykResults;

    @Column(name = "last_snyk_scan")
    private LocalDateTime lastSnykScan;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now().toString();
        updatedAt = LocalDateTime.now().toString();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now().toString();
    }

    public void processSnykResults(String snykJson, Sbom sbom) {
        try {
            ObjectMapper mapper = new ObjectMapper();
            JsonNode root = mapper.readTree(snykJson);
            this.snykResults = snykJson;
            this.lastSnykScan = LocalDateTime.now();

            // First, build a map of existing components by package name and version
            Map<String, Component> componentMap = new HashMap<>();
            sbom.getComponents().forEach(component -> 
                componentMap.put(component.getName() + "@" + component.getVersion(), component)
            );

            JsonNode vulns = root.get("vulnerabilities");
            if (vulns != null && vulns.isArray()) {
                for (JsonNode vuln : vulns) {
                    // Get component key
                    String packageName = vuln.get("packageName").asText();
                    String version = vuln.get("version").asText();
                    String componentKey = packageName + "@" + version;

                    // Find or create component
                    Component component = componentMap.computeIfAbsent(componentKey, k -> {
                        Component newComponent = Component.builder()
                            .name(packageName)
                            .version(version)
                            .project(this.project)
                            .sbom(sbom)
                            .build();
                        sbom.addComponent(newComponent);
                        return newComponent;
                    });

                    // Create vulnerability
                    Vulnerability vulnerability = Vulnerability.builder()
                        .cveId(vuln.path("identifiers").path("CVE").get(0).asText())
                        .title(vuln.get("title").asText())
                        .description(vuln.get("description").asText())
                        .cvssScore(vuln.get("cvssScore").asDouble())
                        .cvssVector(vuln.get("CVSSv3").asText())
                        .severity(vuln.get("severity").asText())
                        .riskLevel(RiskLevel.valueOf(vuln.get("severity").asText().toUpperCase()))
                        .fixVersion(vuln.path("fixedIn").get(0).asText())
                        .project(this.project)
                        .build();

                    // Process dependency path
                    JsonNode fromPath = vuln.get("from");
                    if (fromPath != null && fromPath.isArray()) {
                        Component parentComponent = null;
                        for (int i = 0; i < fromPath.size(); i++) {
                            String[] parts = fromPath.get(i).asText().split("@");
                            String currentPackage = parts[0];
                            String currentVersion = parts.length > 1 ? parts[1] : "latest";
                            String currentKey = currentPackage + "@" + currentVersion;

                            Component currentComponent = componentMap.computeIfAbsent(currentKey, k -> {
                                Component newComponent = Component.builder()
                                    .name(currentPackage)
                                    .version(currentVersion)
                                    .project(this.project)
                                    .sbom(sbom)
                                    .build();
                                sbom.addComponent(newComponent);
                                return newComponent;
                            });

                            if (parentComponent != null) {
                                // Create dependency edge
                                parentComponent.addOutgoingDependency(currentComponent);
                                currentComponent.addIncomingDependency(parentComponent);
                            }
                            parentComponent = currentComponent;
                        }
                    }

                    // Link component and vulnerability
                    component.addVulnerability(vulnerability);
                }
            }
        } catch (Exception e) {
            throw new RuntimeException("Failed to process Snyk results: " + e.getMessage());
        }
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public void addSbom(Sbom sbom) {
        sboms.add(sbom);
        sbom.setRepository(this);
    }

    public void removeSbom(Sbom sbom) {
        sboms.remove(sbom);
        sbom.setRepository(null);
    }

    public Sbom getSbom() {
        return sboms.stream().findFirst().orElse(null);
    }

    public void setSbom(Sbom sbom) {
        // This method is no longer used as the repository now holds multiple sboms
    }
} 