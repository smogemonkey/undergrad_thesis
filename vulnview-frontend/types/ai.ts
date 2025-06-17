export interface AiRemediationRequest {
    vulnerabilityDbId: string;
    affectedComponentPurl: string;
    affectedComponentVersion: string;
    projectContextDescription: string;
}

export interface RemediationSuggestion {
    type: 'UPGRADE_VERSION' | 'CONFIGURATION_CHANGE' | 'CODE_MODIFICATION' | 'WORKAROUND';
    description: string;
    codeSnippet?: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface AiRemediationResponse {
    vulnerabilitySummary: string;
    componentContextSummary?: string;
    suggestedRemediations: RemediationSuggestion[];
    overallRiskAssessment?: string;
    disclaimer: string;
}

export interface VulnerableComponent {
    id: number;
    name: string;
    version: string;
    vulnerabilities: {
        id: number;
        cveId: string;
        title: string;
        severity: string;
        cvssScore: number;
    }[];
}

export interface SbomAnalysis {
    totalComponents: number;
    vulnerableComponents: VulnerableComponent[];
    severityCounts: Record<string, number>;
    averageCvssScore: number;
} 