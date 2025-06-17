export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    SEND_OTP: '/api/v1/auth/send-otp',
    GITHUB_CONNECT: '/api/v1/auth/github/connect',
    GITHUB_DISCONNECT: '/api/v1/auth/github/disconnect',
  },

  // Project endpoints
  PROJECT: (projectId: string) => `/api/v1/projects/${projectId}`,
  PROJECTS: '/api/v1/projects',
  PROJECT_REPOSITORIES: (projectId: string) => `/api/v1/dashboard/projects/${projectId}/repositories`,
  PROJECT_REPOSITORY: (projectId: string, repositoryId: number) => 
    `/api/v1/projects/${projectId}/repositories/${repositoryId}`,

  // Repository endpoints
  REPOSITORY: (repositoryId: number) => `/api/v1/repositories/${repositoryId}`,
  REPOSITORY_SYNC: (repositoryId: number) => `/api/v1/repositories/${repositoryId}/sync`,
  REPOSITORY_STATUS: (repositoryId: number) => `/api/v1/repositories/${repositoryId}/status`,

  // SBOM endpoints
  SBOM: {
    GENERATE: (repositoryId: number) => `/api/v1/sbom/generate/${repositoryId}`,
    GET: (sbomId: string) => `/api/v1/sbom/${sbomId}`,
    UPLOAD: '/api/v1/sbom/upload',
    SCAN: (sbomId: string) => `/api/v1/scan/sbom/${sbomId}`,
  },

  // Scan endpoints
  SCAN: {
    START: (sbomId: number) => `/api/v1/scan/sbom/${sbomId}/start`,
    STATUS: (scanId: string) => `/api/v1/scan/status/${scanId}`,
    RESULTS: (scanId: string) => `/api/v1/scan/results/${scanId}`,
  },

  // GitHub endpoints
  GITHUB: {
    CONNECT: '/api/v1/github/connect',
    CALLBACK: '/api/v1/github/callback',
    REPOSITORIES: '/api/v1/github/repositories',
    CONNECT_REPO: (owner: string, repo: string) => `/api/v1/github/repositories/${owner}/${repo}/connect`,
    SYNC: (repositoryId: number) => `/api/v1/github/repositories/${repositoryId}/sync`,
    SBOM: (repositoryId: number) => `/api/v1/github/repositories/${repositoryId}/sbom`,
    DISCONNECT: '/api/v1/github/disconnect',
    SETTINGS: '/api/v1/github/settings',
  },

  // Vulnerability endpoints
  VULNERABILITIES: {
    AI_SUMMARY: '/api/v1/vulnerabilities/ai-summary',
    LIST: (projectId: string) => `/api/v1/vulnerabilities/${projectId}`,
    DETAILS: (vulnerabilityId: string) => `/api/v1/vulnerabilities/${vulnerabilityId}`,
    REMEDIATION: (vulnerabilityId: string) => `/api/v1/vulnerabilities/${vulnerabilityId}/remediation`,
    TRENDS: '/api/v1/vulnerabilities/trends',
    SCAN: (sbomId: string) => `/api/v1/vulnerabilities/scan/${sbomId}`,
  },

  // Report endpoints
  REPORTS: {
    LIST: '/api/v1/reports',
    GENERATE: '/api/v1/reports/generate',
    DOWNLOAD: (reportId: string) => `/api/v1/reports/${reportId}/download`,
  },

  SNYK: {
    SCAN: (sbomId: number) => `/api/v1/vulnerabilities/scan/sbom/${sbomId}`,
    STATUS: (scanId: string) => `/api/v1/scan/status/${scanId}`,
    RESULTS: (scanId: string) => `/api/v1/scan/results/${scanId}`,
  },

  DASHBOARD: {
    PROJECTS: '/api/v1/dashboard/projects',
    PROJECT_REPOSITORIES: (projectId: string) => `/api/v1/dashboard/projects/${projectId}/repositories`,
    PROJECT_DETAILS: (projectId: string) => `/api/v1/dashboard/projects/${projectId}`,
  },
} as const;