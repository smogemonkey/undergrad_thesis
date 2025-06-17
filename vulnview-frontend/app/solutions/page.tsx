"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Info } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { API_BASE_URL } from '@/lib/constants';

interface Solution {
  id: string;
  vulnerabilityId: string;
  componentName: string;
  componentVersion: string;
  context: string;
  remediation: string;
  suggestion: string;
  timestamp: string;
  severity: string;
}

export default function SolutionsPage() {
  const [solutions, setSolutions] = useState<Solution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSolutions = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/ai/solutions`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch solutions');
        }

        const data = await response.json();
        setSolutions(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load solutions');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSolutions();
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto p-6 space-y-4">
        <h1 className="text-3xl font-bold">AI Solutions</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="bg-destructive/10">
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Info className="h-5 w-5 text-destructive" />
              <p className="text-destructive">Error: {error}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-4">
      <h1 className="text-3xl font-bold">AI Solutions</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {solutions.map((solution) => (
          <Card key={solution.id} className="overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  {solution.componentName} {solution.componentVersion}
                </CardTitle>
                <span className={`px-2 py-1 rounded text-xs ${
                  solution.severity === 'HIGH' ? 'bg-red-100 text-red-800' :
                  solution.severity === 'MEDIUM' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {solution.severity}
                </span>
              </div>
              <CardDescription>
                Generated on {new Date(solution.timestamp).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                <div className="space-y-4">
                  <div>
                    <h3 className="font-medium text-primary mb-1">Context</h3>
                    <p className="text-sm text-muted-foreground">{solution.context}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary mb-1">Remediation Steps</h3>
                    <p className="text-sm text-muted-foreground">{solution.remediation}</p>
                  </div>
                  <div>
                    <h3 className="font-medium text-primary mb-1">Additional Suggestions</h3>
                    <p className="text-sm text-muted-foreground">{solution.suggestion}</p>
                  </div>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 