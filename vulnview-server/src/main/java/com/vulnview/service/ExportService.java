package com.vulnview.service;

import com.vulnview.enums.ExportFormat;
import java.io.OutputStream;

public interface ExportService {
    /**
     * Export SBOM data in CycloneDX format
     * @param buildId The ID of the build to export
     * @param outputStream The output stream to write to
     */
    void exportSbomAsCycloneDx(Long buildId, OutputStream outputStream);

    /**
     * Export vulnerability data in CSV format
     * @param buildId The ID of the build to export
     * @param outputStream The output stream to write to
     */
    void exportVulnerabilitiesAsCsv(Long buildId, OutputStream outputStream);

    /**
     * Export component data in CSV format
     * @param buildId The ID of the build to export
     * @param outputStream The output stream to write to
     */
    void exportComponentsAsCsv(Long buildId, OutputStream outputStream);

    byte[] exportVulnerabilityReport(Long projectId, ExportFormat format);
} 