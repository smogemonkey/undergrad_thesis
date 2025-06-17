package com.vulnview.dto.graph;

import lombok.*;
import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphDataResponse {
    private List<GraphNode> nodes;
    private List<GraphLink> links;
    private String scanStatus;
    private Map<String, Object> summary;

    public static GraphDataResponse customBuilder(List<GraphNode> nodes, List<GraphLink> links) {
        GraphDataResponse response = new GraphDataResponse();
        response.setNodes(nodes);
        response.setLinks(links);
        response.setScanStatus(null);
        return response;
    }
} 
 
 