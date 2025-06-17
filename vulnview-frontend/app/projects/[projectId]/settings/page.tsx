"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Github, RefreshCw, Unlink, Plus } from "lucide-react";
import { getAuthHeaders, isAuthenticated } from "@/lib/auth";
import { VulnerabilityTrends } from "@/components/vulnerability-trends";
import { VulnerabilityAIAnalyzer } from "@/components/vulnerability-ai-analyzer";
import { RepositoryList } from "@/components/repository-list";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/config";
import { githubService } from "@/services/githubService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Project {
  id: string;
  name: string;
  description: string;
  repositoryCount: number;
  lastScan: string;
  repositories: Array<{
    id: number;
    name: string;
    owner: string;
    lastSync: string | null;
  }>;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  private: boolean;
  default_branch: string;
}

interface ProjectSettingsPageProps {
  params: {
    projectId: string;
  };
}

export default function ProjectSettingsPage({ params }: ProjectSettingsPageProps) {
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [availableRepos, setAvailableRepos] = useState<Repository[]>([]);
  const [isLoadingRepos, setIsLoadingRepos] = useState(false);
  const [githubUsername, setGithubUsername] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (isAuthenticated()) {
      fetchProject();
      // Check if GitHub is connected
      const storedUsername = localStorage.getItem('githubUsername');
      setGithubUsername(storedUsername);
    }
  }, [params.projectId]);

  const fetchProject = async () => {
    try {
      const data = await apiFetch<Project>(API_ENDPOINTS.PROJECT(params.projectId));
      setProject(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch project details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAvailableRepos = async () => {
    setIsLoadingRepos(true);
    try {
      const repos = await githubService.getRepositories();
      setAvailableRepos(repos);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch GitHub repositories",
        variant: "destructive",
      });
    } finally {
      setIsLoadingRepos(false);
    }
  };

  const handleSyncRepository = async (repositoryId: number) => {
    setIsSyncing(true);
    try {
      await apiFetch(API_ENDPOINTS.GITHUB.SYNC(params.projectId, repositoryId), {
        method: 'POST'
      });
      toast({
        title: "Success",
        description: "Repository sync started successfully",
      });
      fetchProject(); // Refresh project data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync repository",
        variant: "destructive",
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnectRepository = async (repositoryId: number) => {
    try {
      await apiFetch(`${API_ENDPOINTS.PROJECT(params.projectId)}/repositories/${repositoryId}`, {
        method: 'DELETE'
      });
      toast({
        title: "Success",
        description: "Repository disconnected successfully",
      });
      fetchProject(); // Refresh project data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect repository",
        variant: "destructive",
      });
    }
  };

  const handleConnectGithub = () => {
    try {
      const authUrl = githubService.getAuthUrl();
      window.location.href = authUrl;
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to GitHub",
        variant: "destructive",
      });
    }
  };

  const handleDisconnectGithub = async () => {
    try {
      await apiFetch(`${API_ENDPOINTS.AUTH}/github/disconnect`, {
        method: 'POST'
      });
      localStorage.removeItem('githubUsername');
      setGithubUsername(null);
      toast({
        title: "Success",
        description: "GitHub account disconnected successfully",
      });
      fetchProject(); // Refresh project data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to disconnect GitHub account",
        variant: "destructive",
      });
    }
  };

  const handleAddRepository = async (repo: Repository) => {
    try {
      await apiFetch(`${API_ENDPOINTS.PROJECT(params.projectId)}/repositories`, {
        method: 'POST',
        body: JSON.stringify({
          owner: repo.full_name.split('/')[0],
          repo: repo.name
        })
      });
      toast({
        title: "Success",
        description: "Repository connected successfully",
      });
      fetchProject(); // Refresh project data
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect repository",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Project Settings</h1>
        {githubUsername ? (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Connected as: {githubUsername}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDisconnectGithub}
            >
              <Unlink className="w-4 h-4 mr-2" />
              Disconnect GitHub
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={handleConnectGithub}
          >
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-32">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : project ? (
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">Name</h3>
                  <p className="text-muted-foreground">{project.name}</p>
                </div>
                <div>
                  <h3 className="font-medium">Description</h3>
                  <p className="text-muted-foreground">{project.description}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Connected Repositories</CardTitle>
              {githubUsername && (
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Repository
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Repository</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      {isLoadingRepos ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {availableRepos.map((repo) => (
                            <Button
                              key={repo.id}
                              variant="outline"
                              className="w-full justify-start"
                              onClick={() => handleAddRepository(repo)}
                            >
                              {repo.full_name}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </CardHeader>
            <CardContent>
              <RepositoryList
                projectId={params.projectId}
                repositories={project.repositories.map(repo => ({
                  id: repo.id,
                  name: repo.name,
                  owner: repo.owner,
                  fullName: `${repo.owner}/${repo.name}`,
                  description: null,
                  defaultBranch: 'main',
                  lastSyncedAt: repo.lastSync
                }))}
                isLoading={isLoading}
                onSync={handleSyncRepository}
                onDelete={handleDisconnectRepository}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Vulnerability Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <VulnerabilityTrends projectId={parseInt(params.projectId)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>AI Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <VulnerabilityAIAnalyzer projectId={parseInt(params.projectId)} />
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="text-center py-10">
          <p className="text-muted-foreground">Project not found</p>
        </div>
      )}
    </div>
  );
}