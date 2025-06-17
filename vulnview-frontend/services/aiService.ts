import { toast } from "sonner";

export interface SbomComponent {
  id: string;
  name: string;
  version: string;
  purl: string;
  type: string;
  vulnerabilities: Vulnerability[];
  dependencies?: SbomComponent[];
}

export interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: string;
  cvssScore: number;
  publishedDate: string;
  lastModifiedDate: string;
}

export interface AiRemediationRequest {
  vulnerabilityDbId: string;
  affectedComponentPurl: string;
  affectedComponentVersion: string;
  buildIdContext?: string;
  projectContextDescription?: string;
}

export interface AiRemediationResponse {
  vulnerabilitySummary: string;
  componentContextSummary: string;
  suggestedRemediations: Array<{
    type: 'UPGRADE_VERSION' | 'CONFIGURATION_CHANGE' | 'CODE_MODIFICATION' | 'WORKAROUND';
    description: string;
    codeSnippet?: string;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedEffort: 'LOW' | 'MEDIUM' | 'HIGH';
  }>;
  overallRiskAssessment: string;
  disclaimer: string;
}

export interface AiAlternativeRequest {
  componentPurl: string;
  currentVersion: string;
  mainUsageDescription: string;
  desiredCharacteristics: string[];
  constraints: string[];
}

export interface AiAlternativeResponse {
  originalComponentName: string;
  originalComponentVersion: string;
  summary: string;
  alternatives: Array<{
    name: string;
    suggestedVersion: string;
    confidenceScore: number;
    reasoning: string;
    notes?: string;
    licenseSpdxId?: string;
  }>;
  disclaimer: string;
}

class AiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || '';
  }

  private async fetchWithAuth(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'An error occurred' }));
      throw new Error(error.message || 'Failed to fetch data');
    }

    return response.json();
  }

  async getRemediationSuggestion(request: AiRemediationRequest): Promise<AiRemediationResponse> {
    try {
      return await this.fetchWithAuth('/api/v1/ai/remediation', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error getting remediation suggestion:', error);
      toast.error('Failed to get remediation suggestion');
      throw error;
    }
  }

  async suggestAlternativePackages(request: AiAlternativeRequest): Promise<AiAlternativeResponse> {
    try {
      return await this.fetchWithAuth('/api/v1/ai/alternatives', {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error getting alternative packages:', error);
      toast.error('Failed to get alternative packages');
      throw error;
    }
  }

  async analyzeSbom(sbomId: string): Promise<{
    components: SbomComponent[];
    vulnerabilities: Vulnerability[];
    summary: {
      totalComponents: number;
      vulnerableComponents: number;
      criticalVulnerabilities: number;
      highVulnerabilities: number;
      mediumVulnerabilities: number;
      lowVulnerabilities: number;
    };
  }> {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${this.baseUrl}/api/v1/ai/sbom/${sbomId}/analysis`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        },
      });

      if (!response.ok) {
        throw new Error('Failed to analyze SBOM');
      }

      return await response.json();
    } catch (error) {
      toast.error('Failed to analyze SBOM');
      throw error;
    }
  }
}

export const aiService = new AiService(); 