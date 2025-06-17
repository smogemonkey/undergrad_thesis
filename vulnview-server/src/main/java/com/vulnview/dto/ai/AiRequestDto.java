package com.vulnview.dto.ai;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRequestDto {
    private Long componentId;
    private String vulnerabilityId;
    private String projectContextDescription;
} 