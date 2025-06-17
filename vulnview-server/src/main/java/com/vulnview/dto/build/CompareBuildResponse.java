package com.vulnview.dto.build;

import com.vulnview.dto.BuildDTO;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CompareBuildResponse {
    private BuildDTO build1;
    private BuildDTO build2;
    private int addedComponents;
    private int removedComponents;
    private int updatedComponents;
    private int vulnerabilityChange;
} 