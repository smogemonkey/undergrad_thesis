export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/v1/auth/login',
    REGISTER: '/api/v1/auth/register',
    SEND_OTP: '/api/v1/auth/send-otp',
  },
  PROJECTS: {
    LIST: '/api/v1/projects',
    DETAIL: (id: string) => `/api/v1/projects/${id}`,
    GRAPH: (id: string) => `/api/v1/projects/${id}/graph`,
    VULNERABILITY_TRENDS: (id: string, days: number = 30) => 
      `/api/v1/projects/${id}/vulnerability-trends?days=${days}`,
    VULNERABILITY_DISTRIBUTION: (id: string) => 
      `/api/v1/projects/${id}/vulnerability-distribution`,
  },
  GITHUB: {
    CONNECT: '/api/v1/github/connect',
    CALLBACK: '/api/v1/github/callback',
    REPOSITORIES: '/api/v1/github/repositories',
    SYNC: (repositoryId: number) => `/api/v1/github/repositories/${repositoryId}/sync`,
    SBOM: (repositoryId: number) => `/api/v1/github/repositories/${repositoryId}/sbom`,
  },
  REPOSITORIES: {
    SBOM: (repoId: string) => `/api/v1/repositories/${repoId}/sbom`,
  },
  SBOM: {
    GENERATE: '/api/v1/sbom/generate',
    UPLOAD: '/api/v1/sbom/upload',
    STATUS: (id: string) => `/api/v1/sbom/${id}/status`,
    ANALYZE: '/api/v1/sbom/analyze',
  },
  AI: {
    REMEDIATION: '/api/v1/ai/remediation',
  },
  VULNERABILITIES: {
    AI_SUMMARY: '/api/v1/vulnerabilities/ai-summary',
    SCAN: '/api/v1/vulnerabilities/scan',
    SCAN_STATUS: (scanId: string) => `/api/v1/vulnerabilities/scan/${scanId}/status`,
  },
  BUILDS: {
    LIST: (projectId: string) => `/api/v1/projects/${projectId}/builds`,
    COMPARE: (build1Id: string, build2Id: string) => 
      `/api/v1/builds/compare?build1=${build1Id}&build2=${build2Id}`,
  },
  REPORTS: {
    LIST: '/api/v1/reports',
    GENERATE: '/api/v1/reports/generate',
    DOWNLOAD: (id: string) => `/api/v1/reports/${id}/download`,
  },
  USERS: {
    LIST: '/api/v1/users',
    DETAIL: (id: string) => `/api/v1/users/${id}`,
  },
} as const;