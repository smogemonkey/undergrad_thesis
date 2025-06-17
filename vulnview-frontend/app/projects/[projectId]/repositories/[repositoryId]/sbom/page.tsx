"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ExternalLink, GitCompare, Loader2, Shield, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { InteractiveDashboard } from "@/components/interactive-dashboard";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/config";
import { EnhancedNodeDetail } from "@/components/enhanced-node-detail";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { type RiskLevel, type GraphNode } from "@/components/highly-interactive-graph";
import { Tabs, TabsContent } from "@/components/ui/tabs";

const API_BASE_URL = "http://localhost:8080";

interface SbomApiResponse {
  content: any[];
  page: number;
  totalPages: number;
  totalElements: number;
}

interface Vulnerability {
  id: string;
  title?: string;
  severity: string;
  cvss: string;
  cvssScore?: number;
  packageName?: string;
  version?: string;
  description?: string;
  remediation?: string;
}

interface ScanResults {
  vulnerabilities: Vulnerability[];
  summary?: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

const riskLevels: Record<RiskLevel, { label: string; color: string; range: string; }> = {
  critical: { label: "Critical risk", color: "bg-red-600", range: "CVSS 9.0-10.0" },
  high: { label: "High risk", color: "bg-red-500", range: "CVSS 7.0-8.9" },
  medium: { label: "Medium risk", color: "bg-orange-500", range: "CVSS 4.0-6.9" },
  low: { label: "Low risk", color: "bg-yellow-400", range: "CVSS 0.1-3.9" },
  safe: { label: "Safe component", color: "bg-blue-500", range: "No vulnerabilities" },
  unknown: { label: "Unknown risk", color: "bg-gray-400", range: "N/A"},
};

export default function RepositorySbomPage({ params }: { params: { projectId: string; repositoryId: string } }) {
  const [sboms, setSboms] = useState<any[]>([]);
  const [selectedSbomId, setSelectedSbomId] = useState<string | null>(null);
  const [isLoadingSboms, setIsLoadingSboms] = useState(true);
  const [componentSummary, setComponentSummary] = useState<any>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const { toast } = useToast();
  const { getAuthHeaders } = useAuth();
  const router = useRouter();
  const [commits, setCommits] = useState<any[]>([]);
  const [isLoadingCommits, setIsLoadingCommits] = useState(false);
  const [selectedCommitSha, setSelectedCommitSha] = useState<string>("");
  const [isGeneratingSbom, setIsGeneratingSbom] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");
  const [components, setComponents] = useState<any[]>([]);
  const [graphData, setGraphData] = useState<any>(null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(false);
  const [scanStatus, setScanStatus] = useState<string>("");
  const [scanId, setScanId] = useState<string | null>(null);
  const pollingRef = useRef<NodeJS.Timeout>();
  const [refreshCounter, setRefreshCounter] = useState(0);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const searchParams = useSearchParams();
  const [visibility, setVisibility] = useState<Record<RiskLevel, boolean>>({
    critical: true, high: true, medium: true, low: true, safe: true, unknown: true
  });
  const [isLoadingAiSuggestion, setIsLoadingAiSuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);

  const handleNodeClick = useCallback((node: GraphNode) => {
    console.log('[Page] handleNodeClick called with node:', node);
    if (!node) {
      console.warn('[Page] Received null/undefined node in handleNodeClick');
      return;
    }
    
    // Ensure we have all required node properties
    if (!node.id || !node.name || !node.riskLevel) {
      console.warn('[Page] Node is missing required properties:', node);
      return;
    }

    console.log('[Page] Setting selected node:', node);
    setSelectedNode(node);
  }, []);

  const handleVisibilityChange = (level: RiskLevel, checked: boolean) => {
    setVisibility(prev => ({ ...prev, [level]: checked }));
  };

  const fetchScanStatus = useCallback(async (currentScanId: string): Promise<void> => {
    try {
      console.log("=================================================");
      console.log("            CHECKING SCAN STATUS                  ");
      console.log("=================================================");
      
      const statusData = await apiFetch<any>(API_ENDPOINTS.SCAN.STATUS(currentScanId));
      console.log("Scan Status Response:", {
        scanId: currentScanId,
        status: statusData.status,
        progress: statusData.progress,
        timestamp: new Date().toISOString()
      });
      
      setScanStatus(statusData.status);
      
      if (statusData.status === 'COMPLETED') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        
        // Fetch scan results when completed
        console.log("-------------------------------------------------");
        console.log("            FETCHING SCAN RESULTS                 ");
        console.log("-------------------------------------------------");
        
        const resultsData = await apiFetch<ScanResults>(API_ENDPOINTS.SCAN.RESULTS(currentScanId));
        console.log("Scan Results:", {
          totalVulnerabilities: resultsData.vulnerabilities?.length || 0,
          summary: {
            critical: resultsData.vulnerabilities?.filter(v => v.severity === 'critical').length || 0,
            high: resultsData.vulnerabilities?.filter(v => v.severity === 'high').length || 0,
            medium: resultsData.vulnerabilities?.filter(v => v.severity === 'medium').length || 0,
            low: resultsData.vulnerabilities?.filter(v => v.severity === 'low').length || 0
          },
          details: resultsData.vulnerabilities?.map(v => ({
            id: v.id,
            title: v.title,
            severity: v.severity,
            cvssScore: v.cvssScore,
            packageName: v.packageName,
            version: v.version,
            description: v.description
          }))
        });
        
        setRefreshCounter(c => c + 1);
        toast({ 
          title: "Scan Complete", 
          description: `Found ${resultsData.vulnerabilities?.length || 0} vulnerabilities.`,
        });
      } else if (statusData.status === 'FAILED') {
        if (pollingRef.current) clearInterval(pollingRef.current);
        console.error("Scan Failed:", statusData.errorMessage);
        setRefreshCounter(c => c + 1);
        toast({
          title: "Scan Failed",
          description: `Vulnerability scan failed: ${statusData.errorMessage || 'Unknown error'}`,
          variant: "destructive"
        });
      } else {
        console.log(`Scan in progress: ${statusData.status}`);
        if (statusData.progress) {
          console.log("Progress:", statusData.progress);
        }
      }
    } catch (error) {
      console.error("Failed to fetch scan status:", error);
      if (pollingRef.current) clearInterval(pollingRef.current);
      toast({
        title: "Error",
        description: "Failed to check scan status",
        variant: "destructive"
      });
    }
  }, [toast]);

  const startPolling = useCallback((currentScanId: string): void => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    pollingRef.current = setInterval(() => {
      fetchScanStatus(currentScanId);
    }, 5000);
  }, [fetchScanStatus]);

  const fetchSboms = useCallback(async (): Promise<void> => {
    console.log('Fetching SBOMs for repository:', params.repositoryId);
    setIsLoadingSboms(true);
    try {
      const url = `${API_BASE_URL}/api/v1/sbom/repositories/${params.repositoryId}/sboms?page=0&size=1`;
      console.log('Fetching from URL:', url);
      const res = await fetch(url, { headers: getAuthHeaders() });
      console.log('Response status:', res.status);
      if (!res.ok) throw new Error(`Failed to fetch SBOMs: ${res.statusText}`);
      const data: SbomApiResponse = await res.json();
      console.log('Received SBOM data:', data);
      if (data.content && data.content.length > 0) {
        const latestSbom = data.content[0];
        console.log('Latest SBOM:', latestSbom);
        setSboms([latestSbom]);
        setSelectedSbomId(latestSbom.sbomId.toString());
        if (latestSbom.scanId && latestSbom.scanStatus !== 'COMPLETED') {
          setScanId(latestSbom.scanId);
          setScanStatus(latestSbom.scanStatus);
          startPolling(latestSbom.scanId);
        }
      } else {
        console.log('No SBOMs found in response');
        setSboms([]);
      }
    } catch (error) {
      console.error('Error fetching SBOMs:', error);
      setSboms([]);
      toast({ title: "Error", description: error instanceof Error ? error.message : "Failed to fetch SBOMs for this repository.", variant: "destructive" });
    } finally {
      setIsLoadingSboms(false);
    }
  }, [params.repositoryId, toast, getAuthHeaders, startPolling]);

  const fetchComponentSummary = useCallback(async (sbomId: string) => {
    setIsLoadingSummary(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sbom/repositories/${params.repositoryId}/sbom/${sbomId}/components`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch component summary");
      const data = await res.json();
      setComponentSummary(data.summary || null);
      setComponents(data.components || []);
    } catch (err: any) {
      setComponentSummary(null);
      setComponents([]);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingSummary(false);
    }
  }, [getAuthHeaders, toast, params.repositoryId]);

  const validateGraphData = (data: any): boolean => {
    if (!data) {
      console.error('Graph data is null or undefined');
      return false;
    }

    // Validate nodes
    if (!Array.isArray(data.nodes)) {
      console.error('Graph nodes is not an array:', data.nodes);
      return false;
    }

    // Validate each node
    for (const node of data.nodes) {
      if (!node.id || !node.name || typeof node.riskLevel === 'undefined' || !node.sbomId) {
        console.error('Invalid node structure:', node);
        return false;
      }
      
      // Validate vulnerabilityInfos if present
      if (node.vulnerabilityInfos && Array.isArray(node.vulnerabilityInfos)) {
        for (const vuln of node.vulnerabilityInfos) {
          if (!vuln.id || !vuln.severity || !vuln.cvss) {
            console.error('Invalid vulnerability info structure:', vuln);
            return false;
          }
        }
      }
    }

    // Validate links
    if (!Array.isArray(data.links)) {
      console.error('Graph links is not an array:', data.links);
      return false;
    }

    // Validate each link
    for (const link of data.links) {
      if (typeof link.source === 'undefined' || typeof link.target === 'undefined') {
        console.error('Invalid link structure:', link);
        return false;
      }

      // Verify that source and target nodes exist
      const sourceExists = data.nodes.some((n: any) => n.id === link.source);
      const targetExists = data.nodes.some((n: any) => n.id === link.target);
      
      if (!sourceExists || !targetExists) {
        console.error(`Link references non-existent node. Source: ${link.source}, Target: ${link.target}`);
        return false;
      }
    }

    return true;
  };

  const fetchGraphData = useCallback(async (sbomId: string) => {
    console.log('Fetching graph data for SBOM:', sbomId);
    setIsLoadingGraph(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sbom/repositories/${params.repositoryId}/sbom/${sbomId}/graph?includeVulnerabilities=true`, { 
        headers: getAuthHeaders() 
      });
      
      if (!res.ok) throw new Error("Failed to fetch graph data");
      const data = await res.json();
      
      // Add sbomId to each node
      if (data.nodes) {
        data.nodes = data.nodes.map((node: any) => ({
          ...node,
          sbomId: sbomId
        }));
      }
      
      // Log detailed graph data statistics
      console.log('Received graph data:', {
        totalNodes: data.nodes?.length || 0,
        totalLinks: data.links?.length || 0,
        riskLevelDistribution: data.nodes?.reduce((acc: any, node: any) => {
          acc[node.riskLevel] = (acc[node.riskLevel] || 0) + 1;
          return acc;
        }, {}),
        vulnerabilitiesCount: data.nodes?.reduce((acc: number, node: any) => 
          acc + (node.vulnerabilityInfos?.length || 0), 0
        ),
        sample: {
          firstNode: data.nodes?.[0],
          firstLink: data.links?.[0]
        }
      });

      // Validate graph data structure
      if (!validateGraphData(data)) {
        throw new Error("Invalid graph data structure");
      }

      setGraphData(data);
      
      // Update component summary from graph data
      if (data.summary) {
        setComponentSummary({
          totalComponents: data.summary.totalComponents || 0,
          vulnerableComponents: data.summary.vulnerableComponents || 0,
          bySeverity: {
            critical: Math.floor(data.summary.criticalHigh / 2) || 0,
            high: Math.ceil(data.summary.criticalHigh / 2) || 0,
            medium: Math.floor(data.summary.mediumLow / 2) || 0,
            low: Math.ceil(data.summary.mediumLow / 2) || 0
          }
        });
      }
    } catch (error) {
      console.error('Error fetching graph data:', error);
      toast({ 
        title: "Error", 
        description: "Failed to fetch graph data",
        variant: "destructive" 
      });
      setGraphData(null);
    } finally {
      setIsLoadingGraph(false);
    }
  }, [getAuthHeaders, params.repositoryId, toast]);

  const fetchCommits = useCallback(async () => {
    setIsLoadingCommits(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/sbom/repositories/${params.repositoryId}/commits`, { headers: getAuthHeaders() });
      if (!res.ok) throw new Error("Failed to fetch commits");
      const data = await res.json();
      setCommits(data);
      if (data.length > 0) setSelectedCommitSha(data[0].sha);
    } catch (err: any) {
      setCommits([]);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingCommits(false);
    }
  }, [getAuthHeaders, params.repositoryId, toast]);

  const handleSyncCommit = async () => {
    if (!selectedCommitSha) return;
    setIsSyncing(true);
    setSyncStatus("Syncing repository...");
    try {
      console.log('Starting repository sync...');
      const syncRes = await fetch(`${API_BASE_URL}/api/v1/github/repositories/${params.repositoryId}/sync`, { 
        method: 'POST', 
        headers: getAuthHeaders() 
      });
      if (!syncRes.ok) throw new Error("Failed to sync repository");
      
      const syncData = await syncRes.json();
      console.log('Sync response:', syncData);
      
      if (syncData.status === "error") {
        throw new Error(syncData.message || "Failed to sync repository");
      }
      
      if (!syncData.sbomId) {
        throw new Error("No SBOM ID returned from sync");
      }

      // Reset all states
      setScanStatus("");
      setScanId(null);
      setIsScanning(false);
      setSelectedSbomId(syncData.sbomId.toString());
      setGraphData(null);
      setComponentSummary(null);
      setComponents([]);
      
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = undefined;
      }

      // Fetch fresh data for the new SBOM
      console.log('Fetching fresh data for new SBOM:', syncData.sbomId);
      await Promise.all([
        fetchSboms(),
        fetchComponentSummary(syncData.sbomId.toString()),
        fetchGraphData(syncData.sbomId.toString())
      ]);

      toast({ 
        title: "Success", 
        description: `Repository synced successfully. Found ${syncData.componentsFound} components.` 
      });
      setSyncStatus("");
    } catch (err: any) {
      console.error('Error in handleSyncCommit:', err);
      toast({ title: "Error", description: err.message, variant: "destructive" });
      setSyncStatus("");
    } finally {
      setIsSyncing(false);
    }
  };

  const handleStartScan = async () => {
    if (!selectedSbomId) {
      toast({ title: "Error", description: "No SBOM selected to scan.", variant: "destructive"});
      return;
    }
    
    setIsScanning(true);
    try {
      console.log("=================================================");
      console.log("            STARTING SNYK SCAN                    ");
      console.log("=================================================");
      console.log("SBOM ID:", selectedSbomId);
      
      const scanData = await apiFetch<{ scanId: string }>(
        API_ENDPOINTS.SCAN.START(parseInt(selectedSbomId, 10)), 
        { method: "POST" }
      );
      
      if (scanData && scanData.scanId) {
        console.log("Scan started successfully:", {
          scanId: scanData.scanId,
          timestamp: new Date().toISOString(),
          sbomId: selectedSbomId
        });
        
        setScanId(scanData.scanId);
        setScanStatus('IN_PROGRESS');
        startPolling(scanData.scanId);
        toast({ title: "Scan Started", description: "Vulnerability scan has been initiated." });
      } else {
        throw new Error("Failed to start scan: No scan ID returned.");
      }
    } catch (error) {
      console.error("Failed to start scan:", error);
      toast({ 
        title: "Error", 
        description: error instanceof Error ? error.message : "Failed to start scan.", 
        variant: "destructive" 
      });
    } finally {
      setIsScanning(false);
    }
  };

  const getAiSuggestion = async (vulnerability: Vulnerability, analysisType: 'remediation' | 'alternatives' | 'risk') => {
    setIsLoadingAiSuggestion(true);
    setAiSuggestion(null);
    try {
        if (!selectedNode?.purl) {
            throw new Error('No component selected or missing PURL');
        }

        if (!selectedNode.sbomId) {
            throw new Error('No SBOM ID available for the selected component');
        }

        let formattedSuggestion = '';

        switch (analysisType) {
            case 'remediation': {
                if (!vulnerability.id) {
                    throw new Error('Vulnerability ID is required');
                }

                const remediationRes = await fetch(
                    `${API_BASE_URL}/api/v1/ai/remediation/${encodeURIComponent(vulnerability.id)}`,
                    { 
                        method: 'POST',
                        headers: {
                            ...getAuthHeaders(),
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            componentPurl: selectedNode.purl,
                            projectContextDescription: `This vulnerability was found in the component ${selectedNode.name} version ${selectedNode.version} in project ${params.projectId}.`
                        })
                    }
                );

                if (!remediationRes.ok) {
                    const errorData = await remediationRes.json();
                    throw new Error(errorData.error || 'Failed to get AI remediation');
                }

                const data = await remediationRes.json();
                
                formattedSuggestion = 'REMEDIATION ANALYSIS\n\n';
                
                if (data.suggestedRemediations && Array.isArray(data.suggestedRemediations)) {
                    formattedSuggestion += data.suggestedRemediations
                        .map((remediation: any) => {
                            let section = `${remediation.type}: ${remediation.description}`;
                            if (remediation.codeSnippet) {
                                section += `\n\nCode Example:\n${remediation.codeSnippet}`;
                            }
                            if (remediation.confidence) {
                                section += `\n\nConfidence: ${remediation.confidence}`;
                            }
                            if (remediation.estimatedEffort) {
                                section += `\nEstimated Effort: ${remediation.estimatedEffort}`;
                            }
                            return section;
                        })
                        .join('\n\n');
                } else if (data.remediation || data.content) {
                    formattedSuggestion += data.remediation || data.content;
                }

                if (data.disclaimer) {
                    formattedSuggestion += `\n\n${data.disclaimer}`;
                }
                break;
            }
            
            case 'alternatives': {
                const alternativesRes = await fetch(
                    `${API_BASE_URL}/api/v1/ai/components/suggest-alternatives`,
                    {
                        method: 'POST',
                        headers: {
                            ...getAuthHeaders(),
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            componentPurl: selectedNode.purl,
                            currentVersion: selectedNode.version || 'unknown',
                            mainUsageDescription: `Component used in project ${params.projectId}. Current vulnerability: ${vulnerability.id}`,
                            desiredCharacteristics: ['Better security', 'Maintained', 'Compatible'],
                            constraints: ['Must maintain functionality', 'Compatible with dependencies']
                        })
                    }
                );

                if (!alternativesRes.ok) {
                    const errorData = await alternativesRes.json();
                    throw new Error(errorData.error || 'Failed to get alternative packages');
                }

                const data = await alternativesRes.json();
                
                formattedSuggestion = 'ALTERNATIVE PACKAGES ANALYSIS\n\n';
                
                if (data.alternatives?.length > 0) {
                    data.alternatives.forEach((alt: any) => {
                        formattedSuggestion += `Package: ${alt.name} v${alt.suggestedVersion}\n`;
                        formattedSuggestion += `Confidence Score: ${alt.confidenceScore}\n`;
                        formattedSuggestion += `Reasoning: ${alt.reasoning}\n`;
                        if (alt.notes) formattedSuggestion += `Additional Notes: ${alt.notes}\n`;
                        formattedSuggestion += '\n';
                    });
                } else {
                    formattedSuggestion += 'No suitable alternative packages found.\n';
                }

                if (data.summary) {
                    formattedSuggestion += `\nSummary: ${data.summary}\n`;
                }
                
                if (data.disclaimer) {
                    formattedSuggestion += `\n${data.disclaimer}`;
                }
                break;
            }
            
            case 'risk': {
                // Convert sbomId to number and validate
                const sbomId = Number(selectedNode.sbomId);
                if (isNaN(sbomId)) {
                    throw new Error('Invalid SBOM ID');
                }

                const riskRes = await fetch(
                    `${API_BASE_URL}/api/v1/ai/analyze/sbom/${sbomId}`,
                    {
                        method: 'GET',
                        headers: getAuthHeaders()
                    }
                );

                if (!riskRes.ok) {
                    const errorData = await riskRes.json();
                    throw new Error(errorData.error || 'Failed to get risk analysis');
                }

                const data = await riskRes.json();
                
                formattedSuggestion = 'RISK IMPACT ANALYSIS\n\n';
                
                formattedSuggestion += `Overall Risk Level: ${data.riskLevel}\n`;
                formattedSuggestion += `Average CVSS Score: ${data.averageCvssScore?.toFixed(1)}\n\n`;
                
                if (data.severityCounts) {
                    formattedSuggestion += 'Vulnerability Distribution:\n';
                    Object.entries(data.severityCounts).forEach(([severity, count]) => {
                        formattedSuggestion += `${severity}: ${count} vulnerabilities\n`;
                    });
                }
                
                if (data.riskAssessment) {
                    formattedSuggestion += `\nRisk Assessment:\n${data.riskAssessment}`;
                }
                break;
            }
        }

        setAiSuggestion(formattedSuggestion);

        // Save the analysis
        try {
            await fetch(`${API_BASE_URL}/api/v1/ai/solutions`, {
                method: 'POST',
                headers: {
                    ...getAuthHeaders(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectId: params.projectId,
                    vulnerabilityId: vulnerability.id,
                    suggestion: formattedSuggestion,
                    metadata: {
                        analysisType,
                        componentName: selectedNode.name,
                        componentVersion: selectedNode.version || 'unknown',
                        severity: vulnerability.severity,
                        cvss: vulnerability.cvss,
                        timestamp: new Date().toISOString()
                    }
                })
            });
        } catch (error) {
            console.error('Failed to save AI analysis:', error);
            // Don't show error to user as this is a background operation
        }
    } catch (error) {
        console.error('Error getting AI analysis:', error);
        toast({
            title: "Error",
            description: error instanceof Error ? error.message : "Failed to get AI analysis",
            variant: "destructive"
        });
        setAiSuggestion(null);
    } finally {
        setIsLoadingAiSuggestion(false);
    }
  };

  useEffect(() => {
    const scanIdFromUrl = searchParams.get('scanId');
    const sbomIdFromUrl = searchParams.get('sbomId');
    const isNewRepo = searchParams.get('isNewRepo') === 'true';
    const scanComplete = searchParams.get('scanComplete') === 'true';
    
    // Only start polling if we have a scan ID and it's not marked as complete
    if (scanIdFromUrl && !scanComplete) {
      setScanId(scanIdFromUrl);
      setScanStatus('IN_PROGRESS');
      startPolling(scanIdFromUrl);
    } else if (scanComplete && scanIdFromUrl) {
      // If scan is complete, set the status directly
      setScanId(scanIdFromUrl);
      setScanStatus('COMPLETED');
    }
    
    if (sbomIdFromUrl) {
      console.log('Using SBOM ID from URL:', sbomIdFromUrl);
      setSelectedSbomId(sbomIdFromUrl);
    } else if (!isNewRepo) {
      // Only fetch SBOMs if this is not a new repository redirect
      console.log('No SBOM ID in URL, fetching SBOMs list');
      fetchSboms();
    }
    
    fetchCommits();
    
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchSboms, fetchCommits, searchParams, startPolling]);

  useEffect(() => {
    const fetchData = async () => {
      if (selectedSbomId && (scanStatus === 'COMPLETED' || !scanId)) {
        console.log('Fetching data for SBOM:', selectedSbomId);
        await Promise.all([
          fetchComponentSummary(selectedSbomId),
          fetchGraphData(selectedSbomId)
        ]);
      }
    };

    fetchData();
  }, [selectedSbomId, scanStatus, scanId, fetchComponentSummary, fetchGraphData]);

  const handleSelectSbom = (sbomId: string) => {
    console.log('Selecting SBOM:', sbomId);
    setSelectedSbomId(sbomId);
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
        <Navbar />
        <div className="container mx-auto py-8 max-w-7xl">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-3xl font-bold">Repository Analysis</h1>
                <div className="flex gap-2">
                    <Button onClick={handleStartScan} disabled={isScanning || !selectedSbomId || (scanStatus !== 'FAILED' && scanStatus !== '')}>
                        {isScanning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Shield className="h-4 w-4 mr-2" />}
                        {scanStatus && scanStatus !== 'FAILED' && scanStatus !== '' ? `Scan: ${scanStatus}` : 'Start Vulnerability Scan'}
                    </Button>
                    <Link href={`/compare?projectId=${params.projectId}`} passHref>
                        <Button variant="outline">
                            <GitCompare className="h-4 w-4 mr-2" />
                            Compare Builds
                        </Button>
                    </Link>
                </div>
            </div>

            {scanStatus && scanStatus !== 'COMPLETED' && scanStatus !== 'FAILED' && (
                <Card className="mb-8 bg-blue-50 border-blue-200">
                    <CardContent className="p-6 flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin text-blue-600 mr-4" />
                        <p className="text-blue-800 font-semibold">
                            Vulnerability scan is {scanStatus.toLowerCase()}. The results will be displayed automatically when complete.
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Commit Selection */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Select Commit</CardTitle>
                </CardHeader>
                <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-end gap-4">
                        <div className="flex-1">
                            <Label className="mb-2">Select Commit to Sync and Generate SBOM</Label>
                            {isLoadingCommits ? (
                                <Skeleton className="h-10 w-64" />
                            ) : commits.length === 0 ? (
                                <div className="text-muted-foreground">No commits found for this repository.</div>
                            ) : (
                                <select
                                    className="w-full p-2 border rounded"
                                    value={selectedCommitSha}
                                    onChange={e => setSelectedCommitSha(e.target.value)}
                                >
                                    {commits.map(commit => (
                                        <option key={commit.sha} value={commit.sha}>
                                            {commit.sha.substring(0, 7)} - {commit.message.substring(0, 50)}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </div>
                        <Button
                            onClick={handleSyncCommit}
                            disabled={!selectedCommitSha || isSyncing}
                        >
                            {isSyncing ? (
                                <div className="flex items-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    {syncStatus || "Syncing..."}
                                </div>
                            ) : (
                                "Sync & Generate SBOM"
                            )}
                        </Button>
                    </div>
                    {syncStatus && (
                        <div className="mt-2 text-sm text-muted-foreground">
                            {syncStatus}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Component Summary */}
            {isLoadingSummary ? (
                <Card className="mb-8 animate-pulse">
                    <CardContent className="p-6">Loading summary...</CardContent>
                </Card>
            ) : componentSummary ? (
                <Card className="mb-8">
                    <CardHeader>
                        <CardTitle>Component Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Total Components</p>
                            <p className="text-2xl font-bold">{componentSummary.totalComponents}</p>
                        </div>
                        <div className="bg-red-50 p-3 rounded-lg">
                            <p className="text-sm text-red-500">Vulnerable</p>
                            <p className="text-2xl font-bold text-red-600">{componentSummary.vulnerableComponents}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Critical/High</p>
                            <p className="text-2xl font-bold">{(componentSummary.bySeverity.critical || 0) + (componentSummary.bySeverity.high || 0)}</p>
                        </div>
                        <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500">Medium/Low</p>
                            <p className="text-2xl font-bold">{(componentSummary.bySeverity.medium || 0) + (componentSummary.bySeverity.low || 0)}</p>
                        </div>
                    </CardContent>
                </Card>
            ) : null}

            {/* Graph and Component Details */}
            <Card>
                <CardHeader>
                    <CardTitle>Repository SBOM Graph</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col gap-4">
                        <div className="h-[700px] relative">
                            {isLoadingGraph ? (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 animate-spin" />
                                </div>
                            ) : graphData ? (
                                <InteractiveDashboard 
                                    graphData={graphData}
                                    onNodeClick={handleNodeClick}
                                    params={params}
                                    sbomId={selectedSbomId}
                                    filterSettings={{ selectedRiskLevels: Object.keys(visibility).filter(k => visibility[k as RiskLevel]) as RiskLevel[] }}
                                    key={`${selectedSbomId}-${refreshCounter}`}
                                    selectedNode={selectedNode}
                                    onAskAi={getAiSuggestion}
                                    aiSuggestion={aiSuggestion}
                                    isLoadingAiSuggestion={isLoadingAiSuggestion}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <p className="text-muted-foreground">No graph data available. {selectedSbomId ? 'Failed to load graph.' : 'Select an SBOM to view the graph.'}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </main>
  );
} 