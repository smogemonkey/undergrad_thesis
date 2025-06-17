package com.vulnview.service;

import com.vulnview.dto.vulnerability.VulnerabilityDataDto;
import java.util.List;

public interface OsvApiService {
    /**
     * Fetch vulnerabilities for a component using its Package URL (PURL)
     * @param purl The Package URL of the component
     * @return List of vulnerability data from OSV
     */
    List<VulnerabilityDataDto> fetchVulnerabilities(String purl);
} 