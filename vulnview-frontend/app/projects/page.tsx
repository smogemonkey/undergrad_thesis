"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Github } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/constants";
import { githubService } from "@/services/githubService";
import { ProjectList, ProjectListRef } from "@/components/project-list";

interface Project {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  memberCount: number;
}

export default function ProjectsPage() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGithubConnected, setIsGithubConnected] = useState(false);
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const projectListRef = useRef<ProjectListRef | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Check GitHub connection on mount and when returning from GitHub auth
  useEffect(() => {
    const checkGithubConnection = () => {
      const githubUsername = localStorage.getItem("githubUsername");
      setIsGithubConnected(!!githubUsername);
    };

    checkGithubConnection();
    // Add event listener for storage changes
    window.addEventListener('storage', checkGithubConnection);
    return () => window.removeEventListener('storage', checkGithubConnection);
  }, []);

  // Fetch projects when authenticated or search term changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchProjects();
    } else if (!isAuthenticated && !isLoading) {
      setError("Please log in to view projects.");
      setIsLoading(false);
    }
  }, [isAuthenticated, searchTerm]);

  const fetchProjects = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = searchTerm 
        ? `${API_ENDPOINTS.PROJECTS.LIST}/search?query=${encodeURIComponent(searchTerm)}`
        : API_ENDPOINTS.PROJECTS.LIST;
      
      const data = await apiFetch<Project[]>(url);
      setProjects(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message);
      toast({ 
        title: "Error fetching projects", 
        description: err.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProject = async (projectId: number) => {
    try {
      await apiFetch(API_ENDPOINTS.PROJECTS.DETAIL(projectId.toString()), {
        method: "DELETE",
      });
      toast({ 
        title: "Project Deleted", 
        description: "The project has been successfully deleted." 
      });
      fetchProjects(); // Refresh the list
    } catch (err: any) {
      toast({ 
        title: "Error Deleting Project", 
        description: err.message, 
        variant: "destructive" 
      });
    }
  };

  const handleSyncGithub = async () => {
    setIsConnecting(true);
    try {
      await githubService.initiateAuth();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to GitHub",
        variant: "destructive",
      });
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isAuthenticated && !isLoading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto py-6 text-center">
          <p className="text-red-500">{error || "Please log in to view projects."}</p>
          <Link href="/login">
            <Button className="mt-4">Login</Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold">My Projects</h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:flex-initial">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search projects..."
                className="pl-8 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (projectListRef.current) {
                    projectListRef.current.showCreateDialog();
                  } else {
                    // Fallback if ref is not available
                    router.push('/projects/new');
                  }
                }}
              >
                <PlusCircle className="w-4 h-4 mr-2" />
                Create Project
              </Button>
              {!isGithubConnected && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSyncGithub}
                  disabled={isConnecting}
                >
                  <Github className="w-4 h-4 mr-2" />
                  {isConnecting ? "Connecting..." : "Connect GitHub"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {isLoading && <p className="text-center">Loading projects...</p>}
        {error && <p className="text-center text-red-500">Error: {error}</p>}
        
        <ProjectList
          projects={projects}
          onDelete={handleDeleteProject}
          onProjectCreated={fetchProjects}
          ref={projectListRef}
        />
      </div>
    </main>
  );
} 