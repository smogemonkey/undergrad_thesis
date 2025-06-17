"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";
import { apiFetch } from "@/lib/api";

interface Repository {
  id: number;
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  lastSyncedAt: string | null;
}

interface UseRepositoriesProps {
  projectId: string;
}

export function useRepositories({ projectId }: UseRepositoriesProps) {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const fetchRepositories = async () => {
    try {
      setIsLoading(true);
      const data = await apiFetch<Repository[]>(`/api/v1/github/repositories`);
      setRepositories(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch repositories",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const connectRepository = async (owner: string, repo: string) => {
    try {
      setIsLoading(true);
      const data = await apiFetch<Repository>(`/api/v1/github/repositories/${owner}/${repo}/connect`, {
        method: "POST"
      });

      setRepositories((prev) => [...prev, data]);
      toast({
        title: "Success",
        description: "Repository connected successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect repository",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteRepository = async (repositoryId: number) => {
    try {
      setIsLoading(true);
      await apiFetch(`/api/github/projects/${projectId}/repos?repositoryId=${repositoryId}`, {
        method: "DELETE",
      });

      setRepositories((prev) =>
        prev.filter((repo) => repo.id !== repositoryId)
      );
      toast({
        title: "Success",
        description: "Repository deleted successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete repository",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const syncRepository = async (repositoryId: number) => {
    try {
      setIsLoading(true);
      const data = await apiFetch<Repository>(
        `/api/v1/github/repositories/${repositoryId}/sync`,
        {
          method: "POST",
        }
      );

      setRepositories((prev) =>
        prev.map((repo) =>
          repo.id === repositoryId ? { ...repo, ...data } : repo
        )
      );
      toast({
        title: "Success",
        description: "Repository synced successfully",
      });
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync repository",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return {
    repositories,
    isLoading,
    fetchRepositories,
    connectRepository,
    deleteRepository,
    syncRepository,
  };
} 