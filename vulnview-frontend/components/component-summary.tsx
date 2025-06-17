"use client"

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ComponentGrid } from './component-grid';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowRight, AlertTriangle, Shield } from 'lucide-react';

interface ComponentSummaryProps {
  components: Array<{
  id: string;
  name: string;
  version: string;
    type: string;
    purl: string;
  riskLevel: string;
    vulnerabilities?: any[];
  }>;
  summary: {
    totalComponents: number;
    vulnerableComponents: number;
    bySeverity: {
      critical: number;
      high: number;
      medium: number;
      low: number;
      safe: number;
      unknown: number;
    };
  };
  repositoryId: string;
  sbomId: string;
}

export function ComponentSummary({ components, summary, repositoryId, sbomId }: ComponentSummaryProps) {
  const router = useRouter();
  const topComponents = components.slice(0, 5);

  const handleViewAll = () => {
    router.push(`/repositories/${repositoryId}/sbom/${sbomId}/components`);
  };

  const handleComponentClick = (component: any) => {
    router.push(`/repositories/${repositoryId}/sbom/${sbomId}/components/${encodeURIComponent(component.purl)}`);
  };

    return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">Component Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
    <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{summary.totalComponents}</div>
                <div className="text-sm text-muted-foreground">Total Components</div>
            </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-500">{summary.vulnerableComponents}</div>
                <div className="text-sm text-muted-foreground">Vulnerable Components</div>
            </CardContent>
          </Card>
          <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
          <div>
                    <div className="text-2xl font-bold">{summary.bySeverity.critical + summary.bySeverity.high}</div>
                    <div className="text-sm text-muted-foreground">Critical & High Severity</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Top Components</h3>
              <Button variant="outline" size="sm" onClick={handleViewAll}>
                View All Components
                <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
            </div>
            <ComponentGrid 
              components={topComponents} 
              onComponentClick={handleComponentClick}
            />
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
