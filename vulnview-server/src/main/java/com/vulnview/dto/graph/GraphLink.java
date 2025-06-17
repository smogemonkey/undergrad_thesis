package com.vulnview.dto.graph;

import lombok.Data;
import lombok.Builder;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GraphLink {
    private String source;    // bom-ref of source node
    private String target;    // bom-ref of target node
    private int value;    // for link thickness
} 