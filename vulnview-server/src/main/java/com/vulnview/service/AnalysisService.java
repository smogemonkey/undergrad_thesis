package com.vulnview.service;

import com.vulnview.dto.analysis.AnalysisCreateRequest;
import com.vulnview.dto.analysis.AnalysisResponse;
import com.vulnview.dto.analysis.ReportResponse;

import java.util.List;

public interface AnalysisService {
    AnalysisResponse createAnalysis(AnalysisCreateRequest request);
    AnalysisResponse getAnalysis(Long id);
    List<AnalysisResponse> getAllAnalyses();
    List<AnalysisResponse> getAnalysesByProject(Long projectId);
    void deleteAnalysis(Long id);
    ReportResponse generateReport(Long analysisId);
} 