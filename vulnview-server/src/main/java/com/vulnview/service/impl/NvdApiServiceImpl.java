package com.vulnview.service.impl;

import com.vulnview.dto.ComponentToEnrich;
import com.vulnview.dto.vulnerability.VulnerabilityDataDto;
import com.vulnview.service.NvdApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class NvdApiServiceImpl implements NvdApiService {

    @Value("${vulnview.nvd.api.base-url}")
    private String baseUrl;

    @Value("${vulnview.nvd.api.rate-limit:5}")
    private double requestsPerMinute;

    @Value("${vulnview.nvd.api.api-key}")
    private String apiKey;

    private final RestTemplate restTemplate;
    private static final int MAX_RETRIES = 3;
    private static final long RETRY_DELAY_MS = 6000; // 6 seconds

    @Override
    public List<VulnerabilityDataDto> searchVulnerabilitiesByKeyword(String keyword) {
        log.info("Searching NVD API with keyword: {}", keyword);
        
        try {
            // URL encode the keyword properly
            String encodedKeyword = URLEncoder.encode(keyword, StandardCharsets.UTF_8);
            
            // Construct request URL
            String url = String.format("%s?keywordSearch=%s&resultsPerPage=20", baseUrl, encodedKeyword);
            
            // Set headers
            HttpHeaders headers = new HttpHeaders();
            headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
            headers.set("apiKey", apiKey);
            
            log.info("NVD API Request URL: {}", url);
            log.info("NVD API Request Headers: {}", headers);
            
            // Make request
            ResponseEntity<Map> response = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers),
                Map.class
            );
            
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                List<Map<String, Object>> vulnerabilities = (List<Map<String, Object>>) body.get("vulnerabilities");
                
                if (vulnerabilities != null) {
                    return vulnerabilities.stream()
                        .map(vuln -> {
                            Map<String, Object> cve = (Map<String, Object>) vuln.get("cve");
                            if (cve == null) return null;
                            
                            return VulnerabilityDataDto.builder()
                                .cveId((String) cve.get("id"))
                                .description(extractDescription(cve))
                                .cvssScore(extractCvssScore(cve))
                                .severity(extractSeverity(cve))
                                .publishedDate(parseDate((String) cve.get("published")))
                                .lastModifiedDate(parseDate((String) cve.get("lastModified")))
                                .build();
                        })
                        .filter(Objects::nonNull)
                        .collect(Collectors.toList());
                }
            }
            
            log.info("No vulnerabilities found for keyword: {}", keyword);
            return Collections.emptyList();
            
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                log.warn("Rate limit hit, waiting 6 seconds before retry...");
                try {
                    Thread.sleep(6000);
                    return searchVulnerabilitiesByKeyword(keyword);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Search interrupted", ie);
                }
            }
            log.error("Error searching NVD API with keyword {}: {} : {}", 
                keyword, e.getStatusCode(), e.getResponseBodyAsString());
            return Collections.emptyList();
        } catch (Exception e) {
            log.error("Error searching NVD API with keyword {}: {}", keyword, e.getMessage());
            return Collections.emptyList();
        }
    }

    private String extractDescription(Map<String, Object> cve) {
        List<Map<String, Object>> descriptions = (List<Map<String, Object>>) cve.get("descriptions");
        if (descriptions != null) {
            return descriptions.stream()
                .filter(d -> "en".equals(d.get("lang")))
                .map(d -> (String) d.get("value"))
                .findFirst()
                .orElse(null);
        }
        return null;
    }

    private Double extractCvssScore(Map<String, Object> cve) {
        Map<String, Object> metrics = (Map<String, Object>) cve.get("metrics");
        if (metrics != null) {
            List<Map<String, Object>> cvssV31 = (List<Map<String, Object>>) metrics.get("cvssMetricV31");
            if (cvssV31 != null && !cvssV31.isEmpty()) {
                return ((Number) cvssV31.get(0).get("baseScore")).doubleValue();
            }
            List<Map<String, Object>> cvssV2 = (List<Map<String, Object>>) metrics.get("cvssMetricV2");
            if (cvssV2 != null && !cvssV2.isEmpty()) {
                return ((Number) cvssV2.get(0).get("baseScore")).doubleValue();
            }
        }
        return null;
    }

    private String extractSeverity(Map<String, Object> cve) {
        Map<String, Object> metrics = (Map<String, Object>) cve.get("metrics");
        if (metrics != null) {
            List<Map<String, Object>> cvssV31 = (List<Map<String, Object>>) metrics.get("cvssMetricV31");
            if (cvssV31 != null && !cvssV31.isEmpty()) {
                return (String) cvssV31.get(0).get("baseSeverity");
            }
        }
        return null;
    }

    private LocalDateTime parseDate(String dateStr) {
        if (dateStr == null) return null;
        try {
            return LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_DATE_TIME);
        } catch (Exception e) {
            log.warn("Error parsing date: {}", dateStr);
            return null;
        }
    }

    @Override
    public List<VulnerabilityDataDto> fetchVulnerabilities(String purl) {
        if (purl == null || purl.isEmpty()) {
            log.warn("Empty PURL provided for vulnerability fetch");
            return Collections.emptyList();
        }

        int retryCount = 0;
        while (retryCount < MAX_RETRIES) {
            try {
                // Extract package name and version from PURL
                String[] parts = purl.split("@");
                if (parts.length != 2) {
                    log.warn("Invalid PURL format: {}", purl);
                    return Collections.emptyList();
                }

                String packageName = parts[0].split("/")[parts[0].split("/").length - 1];
                String version = parts[1];

                // Build search query using space as separator
                String searchQuery = String.format("%s %s", packageName, version);
                String url = String.format("%s?keywordSearch=%s&resultsPerPage=20", baseUrl, 
                    URLEncoder.encode(searchQuery, StandardCharsets.UTF_8));
                
                HttpHeaders headers = new HttpHeaders();
                headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
                headers.set("apiKey", apiKey);
                
                HttpEntity<String> entity = new HttpEntity<>(headers);
                // Log the NVD API request URL and headers
                log.info("NVD API Request URL: {}", url);
                log.info("NVD API Request Headers: {}", headers);
                ResponseEntity<Map> responseEntity = restTemplate.exchange(url, HttpMethod.GET, entity, Map.class);
                // Log the raw NVD API response
                log.info("NVD API Raw Response: {}", responseEntity.getBody());

                if (responseEntity.getStatusCode().is2xxSuccessful() && responseEntity.getBody() != null) {
                    return processNvdResponse(responseEntity.getBody());
                }
            } catch (HttpClientErrorException e) {
                log.error("Error searching NVD API with keyword {}: {} : {}", purl, e.getStatusCode(), e.getResponseBodyAsString());
                if (e.getStatusCode() == HttpStatus.TOO_MANY_REQUESTS) {
                    retryCount++;
                    if (retryCount < MAX_RETRIES) {
                        try {
                            Thread.sleep(RETRY_DELAY_MS);
                        } catch (InterruptedException ie) {
                            Thread.currentThread().interrupt();
                            break;
                        }
                    }
                } else {
                    break;
                }
            } catch (Exception e) {
                log.error("Error searching NVD API with keyword {}: {}", purl, e.getMessage(), e);
                break;
            }
        }
        return Collections.emptyList();
    }

    @Override
    public void enrichComponent(ComponentToEnrich component) {
        if (component == null || component.getPurl() == null) {
            log.warn("Invalid component data for enrichment");
            return;
        }

        try {
            List<VulnerabilityDataDto> vulnerabilities = fetchVulnerabilities(component.getPurl());
            if (!vulnerabilities.isEmpty()) {
                log.info("Found {} vulnerabilities for component {}", 
                    vulnerabilities.size(), component.getName());
                // The actual processing of vulnerabilities is handled by VulnerabilityEnrichmentService
            } else {
                log.info("No vulnerabilities found for component {}", component.getName());
            }
        } catch (Exception e) {
            log.error("Error enriching component {}: {}", component.getName(), e.getMessage());
        }
    }

    @Override
    public void scheduleEnrichment(ComponentToEnrich component) {
        // For now, just call enrichComponent directly
        // In a production environment, this would queue the enrichment task
        enrichComponent(component);
    }

    private List<VulnerabilityDataDto> processNvdResponse(Map<String, Object> response) {
        try {
            if (response == null) {
                log.warn("Received null response from NVD API");
                return Collections.emptyList();
            }

            @SuppressWarnings("unchecked")
            List<Map<String, Object>> vulnerabilities = (List<Map<String, Object>>) response.get("vulnerabilities");
            if (vulnerabilities == null || vulnerabilities.isEmpty()) {
                log.info("No vulnerabilities found in NVD response");
                return Collections.emptyList();
            }

            return vulnerabilities.stream()
                .map(this::convertToVulnerabilityDataDto)
                .filter(Objects::nonNull) // Filter out any null DTOs
                .collect(Collectors.toList());
        } catch (Exception e) {
            log.error("Error processing NVD API response: {}", e.getMessage());
            return Collections.emptyList();
        }
    }

    private VulnerabilityDataDto convertToVulnerabilityDataDto(Map<String, Object> vuln) {
        try {
            if (vuln == null) {
                log.warn("Received null vulnerability data");
                return null;
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> cve = (Map<String, Object>) vuln.get("cve");
            if (cve == null) {
                log.warn("No CVE data found in vulnerability");
                return null;
            }

            String cveId = (String) cve.get("id");
            if (cveId == null) {
                log.warn("No CVE ID found in vulnerability data");
                return null;
            }

            VulnerabilityDataDto dto = new VulnerabilityDataDto();
            dto.setCveId(cveId);
            
            // Extract description
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> descriptions = (List<Map<String, Object>>) cve.get("descriptions");
            if (descriptions != null && !descriptions.isEmpty()) {
                for (Map<String, Object> desc : descriptions) {
                    if ("en".equals(desc.get("lang"))) {
                        String description = (String) desc.get("value");
                        dto.setDescription(description != null ? description : "No description available");
                        break;
                    }
                }
            }

            // Extract CVSS metrics
            @SuppressWarnings("unchecked")
            Map<String, Object> metrics = (Map<String, Object>) cve.get("metrics");
            if (metrics != null) {
                // Try CVSS v3.1 first
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> cvssV31 = (List<Map<String, Object>>) metrics.get("cvssMetricV31");
                if (cvssV31 != null && !cvssV31.isEmpty()) {
                    Map<String, Object> cvssData = cvssV31.get(0);
                    if (cvssData != null) {
                        dto.setSeverity((String) cvssData.get("baseSeverity"));
                        Object baseScore = cvssData.get("baseScore");
                        if (baseScore instanceof Number) {
                            dto.setCvssScore(((Number) baseScore).doubleValue());
                        }
                    }
                } else {
                    // Fallback to CVSS v2
                    @SuppressWarnings("unchecked")
                    List<Map<String, Object>> cvssV2 = (List<Map<String, Object>>) metrics.get("cvssMetricV2");
                    if (cvssV2 != null && !cvssV2.isEmpty()) {
                        Map<String, Object> cvssData = cvssV2.get(0);
                        if (cvssData != null) {
                            Object baseScore = cvssData.get("baseScore");
                            if (baseScore instanceof Number) {
                                dto.setCvssScore(((Number) baseScore).doubleValue());
                            }
                        }
                    }
                }
            }

            // Set default values for null fields
            if (dto.getSeverity() == null) {
                dto.setSeverity("UNKNOWN");
            }
            if (dto.getCvssScore() == null) {
                dto.setCvssScore(0.0);
            }
            if (dto.getDescription() == null) {
                dto.setDescription("No description available");
            }

            // Set dates
            String published = (String) cve.get("published");
            String lastModified = (String) cve.get("lastModified");
            dto.setPublishedDate(published != null ? LocalDateTime.parse(published) : LocalDateTime.now());
            dto.setLastModifiedDate(lastModified != null ? LocalDateTime.parse(lastModified) : LocalDateTime.now());

            return dto;
        } catch (Exception e) {
            log.error("Error converting NVD vulnerability data: {}", e.getMessage());
            return null;
        }
    }
} 