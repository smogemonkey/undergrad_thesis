'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { API_ENDPOINTS } from '@/lib/config';

interface Repository {
  id: number;
  name: string;
  owner: string;
  synced: boolean;
  lastSync: string | null;
}

export default function DashboardPage() {
  const [repositories, setRepositories] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState<number | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchRepositories();
  }, []);

  const fetchRepositories = async () => {
    try {
      const data = await apiFetch<Repository[]>(API_ENDPOINTS.GITHUB.REPOSITORIES);
      setRepositories(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch repositories',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (repoId: number) => {
    setSyncing(repoId);
    try {
      await apiFetch(API_ENDPOINTS.REPOSITORY_SYNC(repoId), {
        method: 'POST',
      });
      
      toast({
        title: 'Success',
        description: 'Repository synced successfully',
      });
      
      fetchRepositories();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sync repository',
        variant: 'destructive',
      });
    } finally {
      setSyncing(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      
      <div className="grid gap-6">
        {repositories.length === 0 ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-center flex-col gap-4">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <p className="text-lg text-muted-foreground">No repositories connected</p>
                <Button onClick={() => window.location.href = '/projects'}>
                  Connect Repository
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          repositories.map((repo) => (
            <Card key={repo.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{repo.owner}/{repo.name}</span>
                  <Button
                    onClick={() => handleSync(repo.id)}
                    disabled={syncing === repo.id}
                    variant={repo.synced ? "outline" : "default"}
                  >
                    {syncing === repo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <RefreshCw className="h-4 w-4 mr-2" />
                    )}
                    {repo.synced ? 'Resync' : 'Sync'}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  <p className="text-sm text-muted-foreground">
                    Status: {repo.synced ? 'Synced' : 'Not Synced'}
                  </p>
                  {repo.lastSync && (
                    <p className="text-sm text-muted-foreground">
                      Last Sync: {new Date(repo.lastSync).toLocaleString()}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}