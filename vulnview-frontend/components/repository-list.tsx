"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, RefreshCw, Trash2, FileUp } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { API_ENDPOINTS } from "@/lib/config";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { RepositorySyncHistory } from './repository-sync-history';

interface Repository {
  id: number;
  name: string;
  owner: string;
  fullName: string;
  description: string | null;
  defaultBranch: string;
  lastSyncedAt: string | null;
}

interface RepositoryListProps {
  projectId: string;
  repositories: Repository[];
  isLoading: boolean;
  onSync: (repositoryId: number) => Promise<void>;
  onDelete: (repositoryId: number) => Promise<void>;
}

export function RepositoryList({
  projectId,
  repositories,
  isLoading,
  onSync,
  onDelete,
}: RepositoryListProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [syncingRepos, setSyncingRepos] = useState<Set<number>>(new Set());
  const [deletingRepos, setDeletingRepos] = useState<Set<number>>(new Set());
  const [generatingSbom, setGeneratingSbom] = useState<Set<number>>(new Set());
  const [repoToDelete, setRepoToDelete] = useState<number | null>(null);

  const handleSync = async (repositoryId: number) => {
    setSyncingRepos((prev) => new Set(prev).add(repositoryId));
    try {
      await onSync(repositoryId);
      toast({
        title: "Success",
        description: "Repository sync started",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to sync repository",
        variant: "destructive",
      });
    } finally {
      setSyncingRepos((prev) => {
        const next = new Set(prev);
        next.delete(repositoryId);
        return next;
      });
    }
  };

  const handleDelete = async (repositoryId: number) => {
    setDeletingRepos((prev) => new Set(prev).add(repositoryId));
    try {
      await onDelete(repositoryId);
      toast({
        title: "Success",
        description: "Repository deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete repository",
        variant: "destructive",
      });
    } finally {
      setDeletingRepos((prev) => {
        const next = new Set(prev);
        next.delete(repositoryId);
        return next;
      });
    }
  };

  const handleGenerateSbom = async (repositoryId: number) => {
    setGeneratingSbom((prev) => new Set(prev).add(repositoryId));
    try {
      const data = await apiFetch<{ sbomId: string }>(API_ENDPOINTS.SBOM.GENERATE(repositoryId), {
        method: 'POST',
      });

      toast({
        title: "Success",
        description: "SBOM generation started",
      });
      // Navigate to the SBOM view page
      router.push(`/sbom/${data.sbomId}`);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to generate SBOM",
        variant: "destructive",
      });
    } finally {
      setGeneratingSbom((prev) => {
        const next = new Set(prev);
        next.delete(repositoryId);
        return next;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (repositories.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <p className="text-muted-foreground">No repositories connected yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {repositories.map((repo) => (
        <Card key={repo.id}>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="truncate">{repo.name}</span>
              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleSync(repo.id)}
                  disabled={syncingRepos.has(repo.id)}
                >
                  {syncingRepos.has(repo.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleGenerateSbom(repo.id)}
                  disabled={generatingSbom.has(repo.id)}
                >
                  {generatingSbom.has(repo.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <FileUp className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setRepoToDelete(repo.id)}
                  disabled={deletingRepos.has(repo.id)}
                >
                  {deletingRepos.has(repo.id) ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {repo.description || "No description"}
                </p>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span>Default branch: {repo.defaultBranch}</span>
                </div>
                {repo.lastSyncedAt && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <span>
                      Last synced:{" "}
                      {new Date(repo.lastSyncedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <RepositorySyncHistory repositoryId={repo.id} />
            </div>
          </CardContent>
        </Card>
      ))}

      <AlertDialog
        open={repoToDelete !== null}
        onOpenChange={(open) => !open && setRepoToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Repository</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this repository? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => repoToDelete && handleDelete(repoToDelete)}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
} 