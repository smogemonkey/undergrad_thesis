package com.vulnview.service;

import com.vulnview.dto.graph.GraphDataResponse;

public interface GraphDataService {
    /**
     * Get graph data for a specific build
     * @param buildId the ID of the build
     * @return GraphDataResponse containing nodes and edges
     */
    GraphDataResponse getGraphDataForBuild(String buildId);

    GraphDataResponse getGraphDataForSbom(Long sbomId);
} 
 
 