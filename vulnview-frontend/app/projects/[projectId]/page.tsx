"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { GitBranch, RefreshCw, Plus, BarChart2, FileText, GitPullRequest, Shield, ExternalLink } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/config";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { ManageMembersDialog } from "@/components/manage-members-dialog";
import { z } from "zod";

type Status = 'idle' | 'connecting' | 'syncing' | 'uploading' | 'processing' | 'scanning' | 'done' | 'error';

interface Project {
  id: number;
  name: string;
  description: string;
  projectVersion: string;
  ownerUsername: string;
  createdAt: string;
  pipelineCount: number;
  memberCount: number;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

interface ConnectedRepository {
  id: number;
  name: string;
  description: string;
  defaultBranch: string;
}

interface SbomResponse {
  status: string;
  message: string;
  sbomId: number;
}

interface ScanResponse {
  scanId: string;
}

interface ProjectPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [availableRepos, setAvailableRepos] = useState<Repository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [connectedRepos, setConnectedRepos] = useState<ConnectedRepository[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<Status>('idle');
  const [statusMessage, setStatusMessage] = useState<string>("");
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (isAuthenticated) {
      fetchProject();
      fetchConnectedRepos();
    }
  }, [isAuthenticated, params.projectId]);

  const fetchProject = async () => {
    try {
      const data = await apiFetch<Project>(API_ENDPOINTS.PROJECT(params.projectId));
      setProject(data);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any)?.message || "Failed to fetch project details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchConnectedRepos = async () => {
    try {
      const repos = await apiFetch(`/api/v1/dashboard/projects/${params.projectId}/repositories`);
      setConnectedRepos(repos as ConnectedRepository[]);
    } catch (error) {
      setConnectedRepos([]);
      toast({
        title: "Error",
        description: (error as any)?.message || "Failed to fetch connected repositories",
        variant: "destructive",
      });
    }
  };

  const fetchAvailableRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const repos = await apiFetch(API_ENDPOINTS.GITHUB.REPOSITORIES, {});
      setAvailableRepos(repos as Repository[]);
    } catch (error) {
      toast({
        title: "Error",
        description: (error as any)?.message || "Failed to fetch GitHub repositories",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleAddRepository = async (repository: Repository) => {
    if (status !== 'idle') {
      console.log("Repository sync already in progress, status:", status);
      return;
    }

    try {
      setStatus("connecting");
      setStatusMessage("Connecting repository...");

      const [owner, repo] = repository.full_name.split('/');
      
      // Step 1: Connect Repository
      const connectData = await apiFetch<Repository>(
        API_ENDPOINTS.GITHUB.CONNECT_REPO(owner, repo),
        {
          method: "POST",
          body: JSON.stringify({ projectId: parseInt(params.projectId, 10) })
        }
      );

      if (!connectData?.id) {
        throw new Error("Failed to get repository ID from connect response");
      }

      const repositoryId = connectData.id;

      // Step 2: Sync Repository (this will clone repo and create SBOM)
      setStatus("syncing");
      setStatusMessage("Syncing repository and generating SBOM...");
      
      const syncData = await apiFetch<{ status: string; message: string; vulnerabilitiesFound: number; sbomId: number }>(
        API_ENDPOINTS.GITHUB.SYNC(repositoryId),
        {
          method: "POST"
        }
      );

      if (syncData.status === "error" || !syncData.sbomId) {
        throw new Error(syncData.message || "Failed to sync repository");
      }

      // Step 3: Start vulnerability scan
      setStatus("scanning");
      setStatusMessage("Starting vulnerability scan...");
      
      // Start the scan
      const scanData = await apiFetch<ScanResponse>(
        API_ENDPOINTS.SCAN.START(syncData.sbomId),
        { method: "POST" }
      );

      if (!scanData?.scanId) {
        throw new Error("Failed to start vulnerability scan: No scan ID returned");
      }

      // Step 4: Poll for scan completion
      setStatusMessage("Scanning in progress... Please wait.");
      let scanComplete = false;
      let scanError = null;
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes maximum (with 5-second intervals)

      while (!scanComplete && attempts < maxAttempts) {
        attempts++;
        const scanStatus = await apiFetch<{ status: string; errorMessage?: string }>(
          API_ENDPOINTS.SCAN.STATUS(scanData.scanId)
        );

        if (scanStatus.status === 'COMPLETED') {
          scanComplete = true;
        } else if (scanStatus.status === 'FAILED') {
          scanError = scanStatus.errorMessage || 'Scan failed';
          break;
        } else {
          // Wait 5 seconds before next poll
          await new Promise(resolve => setTimeout(resolve, 5000));
          setStatusMessage(`Scanning in progress... (Attempt ${attempts}/${maxAttempts})`);
        }
      }

      if (scanError) {
        throw new Error(`Scan failed: ${scanError}`);
      }

      if (!scanComplete) {
        throw new Error("Scan timed out after 5 minutes");
      }

      setStatus("done");
      setStatusMessage("Repository synced and scan completed! Redirecting to SBOM analysis...");

      // Get raw Snyk results after scan is complete
      const rawSnykResults = await apiFetch<any>(
        `/api/v1/scan/repositories/${repositoryId}/raw-results`,
        { method: "GET" }
      );

      // Store raw results in localStorage for the SBOM page to use
      localStorage.setItem(`snyk_raw_results_${repositoryId}`, JSON.stringify(rawSnykResults));

      // Redirect with both SBOM ID and scan ID, indicating scan is complete
      router.push(`/projects/${params.projectId}/repositories/${repositoryId}/sbom?sbomId=${syncData.sbomId}&scanId=${scanData.scanId}&isNewRepo=true&scanComplete=true`);

    } catch (error) {
      console.error("Error in handleAddRepository:", error);
      setStatus("error");
      setStatusMessage(error instanceof Error ? error.message : "An error occurred");
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to add repository",
        variant: "destructive"
      });
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto py-6 text-center">
          <p className="text-red-500">You must be logged in to view project details.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Project Details</h1>
          <div className="flex gap-2">
            <ManageMembersDialog projectId={params.projectId} />
            <Link href={`/solutions?projectId=${params.projectId}`} passHref>
                <Button variant="outline" size="sm">
                    <Shield className="w-4 h-4 mr-2" />
                    View Solutions
                </Button>
            </Link>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={fetchAvailableRepos} disabled={status !== 'idle'}>
                  <Plus className="w-4 h-4 mr-2" />
                  {status !== 'idle' ? 'Syncing...' : 'Add Repository'}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Repository</DialogTitle>
                  <DialogDescription>
                    Connect a GitHub repository to enable project features. After connecting, the repository will be synced, SBOM will be uploaded, and a vulnerability scan will be performed automatically.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {status !== 'idle' ? (
                    <div className="flex flex-col items-center py-8">
                      <Loader2 className="h-8 w-8 animate-spin mb-4 text-primary" />
                      <p className="font-semibold mb-2">{statusMessage}</p>
                      <p className="text-muted-foreground text-center">This may take a minute. Please do not close this dialog.</p>
                    </div>
                  ) : isLoadingRepos ? (
                    <div className="flex justify-center py-4">
                      <span>Loading...</span>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[400px] overflow-y-auto">
                      {availableRepos.map((repo) => (
                        <Button
                          key={repo.id}
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleAddRepository(repo)}
                          disabled={status !== 'idle'}
                        >
                          {repo.full_name}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8">Loading project details...</div>
        ) : project ? (
          <div className="grid grid-cols-1 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Project Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Name</h3>
                    <p className="text-muted-foreground">{project.name}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Description</h3>
                    <p className="text-muted-foreground">{project.description || "No description available"}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold">Created</h3>
                    <p className="text-muted-foreground">{new Date(project.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {connectedRepos.length === 0 ? (
              <Card className="mb-8">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <p className="text-muted-foreground mb-4">No repository connected. Please add a repository to enable project features.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="mb-8">
                  <CardHeader>
                    <CardTitle>Connected Repositories</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {connectedRepos.map((repo) => (
                        <Link 
                          key={repo.id} 
                          href={`/projects/${params.projectId}/repositories/${repo.id}/sbom`}
                          className="block"
                        >
                          <Card className="hover:bg-accent cursor-pointer transition-colors">
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                  <GitBranch className="h-8 w-8" />
                                  <div>
                                    <h3 className="font-semibold">{repo.name}</h3>
                                    <p className="text-sm text-muted-foreground">{repo.description || "No description"}</p>
                                  </div>
                                </div>
                                <Button variant="ghost" size="sm">
                                  <ExternalLink className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        </Link>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        ) : (
          <Card className="mb-8">
            <CardContent className="flex flex-col items-center justify-center py-8">
              <p className="text-muted-foreground mb-4">No project data available</p>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  );
} 