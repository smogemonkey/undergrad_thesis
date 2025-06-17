"use client"

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/contexts/AuthContext";

interface Repository {
  id: number;
  name: string;
  url: string;
}

interface Commit {
  sha: string;
  message: string;
  author: string;
  date: string;
}

interface Sbom {
  id: number;
  commitSha: string;
  createdAt: string;
  commitMessage?: string;
  commitAuthor?: string;
  vulnerabilityCount?: number;
}

export default function ComparePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = searchParams.get('projectId');
  const repositoryId = searchParams.get('repositoryId');
  const { getAuthHeaders } = useAuth();
  const { toast } = useToast();

  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [sboms, setSboms] = useState<Sbom[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRepository, setSelectedRepository] = useState<string>("");
  const [selectedCommit1, setSelectedCommit1] = useState<string>("");
  const [selectedCommit2, setSelectedCommit2] = useState<string>("");
  const [comparing, setComparing] = useState(false);

  // Fetch repositories when project ID changes
  useEffect(() => {
    if (!projectId) {
      toast({
        title: "Error",
        description: "Project ID is required",
        variant: "destructive"
      });
      return;
    }

    const fetchRepositories = async () => {
      setIsLoading(true);
      try {
        const reposRes = await fetch(
          `http://localhost:8080/api/v1/dashboard/projects/${projectId}/repositories`,
          { headers: getAuthHeaders() }
        );
        if (!reposRes.ok) throw new Error("Failed to fetch repositories");
        const reposData = await reposRes.json();
        setRepositories(reposData);
        
        // If repositoryId is in URL, set it as selected
        if (repositoryId) {
          setSelectedRepository(repositoryId);
        }
      } catch (error) {
        console.error("Error fetching repositories:", error);
        toast({
          title: "Error",
          description: "Failed to fetch repositories",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchRepositories();
  }, [projectId, repositoryId, getAuthHeaders, toast]);

  // Fetch commits and SBOMs when repository is selected
  useEffect(() => {
    if (!selectedRepository) return;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch SBOMs first
        const sbomsRes = await fetch(
          `http://localhost:8080/api/v1/sbom/repositories/${selectedRepository}/sboms`,
          { 
            headers: {
              ...getAuthHeaders(),
              'Accept': 'application/json'
            }
          }
        );
        if (!sbomsRes.ok) throw new Error("Failed to fetch SBOMs");
        const sbomsData = await sbomsRes.json();
        const sboms: Sbom[] = sbomsData.content || [];
        setSboms(sboms);

        // Get all commit SHAs that have SBOMs
        const commitShasWithSboms = new Set(sboms.map(sbom => sbom.commitSha));

        // Fetch commits and filter only those with SBOMs
        const commitsRes = await fetch(
          `http://localhost:8080/api/v1/sbom/repositories/${selectedRepository}/commits`,
          { 
            headers: {
              ...getAuthHeaders(),
              'Accept': 'application/json'
            }
          }
        );
        if (!commitsRes.ok) throw new Error("Failed to fetch commits");
        const commitsData: Commit[] = await commitsRes.json();
        
        // Filter commits that have SBOMs
        const commitsWithSboms = commitsData.filter(commit => 
          commitShasWithSboms.has(commit.sha)
        );
        setCommits(commitsWithSboms);

        console.log('Commits with SBOMs:', commitsWithSboms);
        console.log('SBOMs:', sboms);
    } catch (error) {
        console.error("Error fetching data:", error);
      toast({
          title: "Error",
          description: "Failed to fetch repository data",
          variant: "destructive"
      });
    } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [selectedRepository, getAuthHeaders, toast]);

  const handleRepositoryChange = (repoId: string) => {
    setSelectedRepository(repoId);
    setSelectedCommit1("");
    setSelectedCommit2("");
    // Update URL with new repository ID
    router.push(`/compare?projectId=${projectId}&repositoryId=${repoId}`);
  };

  const handleCompare = async () => {
    if (!selectedCommit1 || !selectedCommit2) {
      toast({
        title: "Error",
        description: "Please select two commits to compare",
        variant: "destructive"
      });
      return;
    }

    setComparing(true);
    try {
      // Find SBOM IDs for the selected commits
      const sbom1 = sboms.find(s => s.commitSha === selectedCommit1);
      const sbom2 = sboms.find(s => s.commitSha === selectedCommit2);

      if (!sbom1 || !sbom2) {
        throw new Error("Could not find SBOMs for selected commits");
      }

      // Navigate to comparison results page
      window.location.href = `/compare/results?sbom1=${sbom1.id}&sbom2=${sbom2.id}&projectId=${projectId}&repositoryId=${selectedRepository}`;
    } catch (error) {
      console.error("Error comparing SBOMs:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to compare SBOMs",
        variant: "destructive"
      });
    } finally {
      setComparing(false);
    }
  };

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
      <Navbar />
      <div className="container mx-auto py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-8">Compare SBOMs</h1>
        
        <Card>
        <CardHeader>
            <CardTitle>Select Repository and Commits to Compare</CardTitle>
        </CardHeader>
          <CardContent className="space-y-6">
            {/* Repository Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Repository</label>
              <Select
                value={selectedRepository}
                onValueChange={handleRepositoryChange}
                disabled={isLoading || repositories.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a repository" />
                </SelectTrigger>
                <SelectContent>
                  {repositories.map((repo) => (
                    <SelectItem key={repo.id} value={repo.id.toString()}>
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedRepository && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* First Commit Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select first commit</label>
                  <Select
                    value={selectedCommit1}
                    onValueChange={setSelectedCommit1}
                    disabled={isLoading}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select first commit" />
                    </SelectTrigger>
                    <SelectContent>
                      {commits.map((commit) => {
                        const date = new Date(commit.date).toLocaleDateString();
                        return (
                          <SelectItem key={commit.sha} value={commit.sha}>
                            {`${commit.sha.substring(0, 7)} - ${date} - ${commit.author} - ${commit.message.substring(0, 30)}...`}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Second Commit Selection */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select second commit</label>
                  <Select
                    value={selectedCommit2}
                    onValueChange={setSelectedCommit2}
                    disabled={isLoading}
                  >
                <SelectTrigger>
                      <SelectValue placeholder="Select second commit" />
                </SelectTrigger>
                <SelectContent>
                      {commits.map((commit) => {
                        const date = new Date(commit.date).toLocaleDateString();
                        return (
                          <SelectItem key={commit.sha} value={commit.sha}>
                            {`${commit.sha.substring(0, 7)} - ${date} - ${commit.author} - ${commit.message.substring(0, 30)}...`}
                    </SelectItem>
                        );
                      })}
                </SelectContent>
              </Select>
            </div>
          </div>
            )}

            {selectedRepository && (
              <div className="flex justify-center mt-6">
          <Button
            onClick={handleCompare}
                  disabled={!selectedCommit1 || !selectedCommit2 || comparing}
                  className="w-full md:w-auto"
          >
            {comparing ? (
              <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Comparing...
              </>
            ) : (
                    'Compare SBOMs'
            )}
          </Button>
              </div>
            )}

            {isLoading && (
              <div className="flex justify-center items-center space-x-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading data...</span>
              </div>
            )}
              </CardContent>
            </Card>
        </div>
    </main>
  );
}
