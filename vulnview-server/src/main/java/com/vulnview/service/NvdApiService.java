package com.vulnview.service;

import com.vulnview.dto.ComponentToEnrich;
import com.vulnview.dto.vulnerability.VulnerabilityDataDto;
import java.util.List;

public interface NvdApiService {
    /**
     * Schedule a component for vulnerability enrichment
     * @param component The component to enrich
     */
    void scheduleEnrichment(ComponentToEnrich component);

    /**
     * Enrich a component with vulnerability data
     * @param component The component to enrich
     */
    void enrichComponent(ComponentToEnrich component);

    /**
     * Search for vulnerabilities using a keyword
     * @param keyword The keyword to search for
     * @return List of vulnerability data
     */
    List<VulnerabilityDataDto> searchVulnerabilitiesByKeyword(String keyword);

    /**
     * Fetch vulnerabilities for a package URL
     * @param purl The package URL to search for
     * @return List of vulnerability data
     */
    List<VulnerabilityDataDto> fetchVulnerabilities(String purl);
} 