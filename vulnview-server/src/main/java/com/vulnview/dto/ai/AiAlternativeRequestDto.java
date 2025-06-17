package com.vulnview.dto.ai;

import lombok.Data;
import lombok.Builder;
import java.util.List;

/**
 * Data Transfer Object for AI alternative package suggestions request.
 */
@Data
@Builder
public class AiAlternativeRequestDto {
    /**
     * The PURL (Package URL) of the current package to find alternatives for.
     */
    private String currentPackagePurl;

    /**
     * Description of the project context and usage of the package.
     */
    private String projectContextDescription;

    /**
     * List of desired characteristics for alternative packages.
     * Example: ["better_performance", "more_permissive_license"]
     */
    private List<String> desiredCharacteristics;

    /**
     * List of constraints that must be satisfied by alternative packages.
     * Example: ["must_be_apache_licensed", "must_support_java_8"]
     */
    private List<String> constraints;
} 