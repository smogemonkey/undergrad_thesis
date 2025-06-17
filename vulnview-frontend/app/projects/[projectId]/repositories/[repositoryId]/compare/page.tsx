"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/navbar";
import { useAuth } from "@/contexts/AuthContext";

const API_BASE_URL = "http://localhost:8080";

interface SbomMeta {
  sbomId: string;
  commit: string;
  createdAt: string;
}

interface ComponentSummary {
  name: string;
  version: string;
  vulnerabilities: number;
}

export default function CompareSbomsPage({ params }: { params: { projectId: string; repositoryId: string } }) {
  const [sboms, setSboms] = useState<SbomMeta[]>([]);
  const [firstSbomId, setFirstSbomId] = useState<string | null>(null);
  const [secondSbomId, setSecondSbomId] = useState<string | null>(null);
  const [firstSummary, setFirstSummary] = useState<ComponentSummary[]>([]);
  const [secondSummary, setSecondSummary] = useState<ComponentSummary[]>([]);
  const [isLoadingSboms, setIsLoadingSboms] = useState(true);
  const [isLoadingComparison, setIsLoadingComparison] = useState(false);
  const [trend, setTrend] = useState<{ commit: string; createdAt: string; vulnerabilities: number }[]>([]);
  const { toast } = useToast();
  const { getAuthHeaders } = useAuth();

  // Fetch all SBOMs for this repository
  const fetchSboms = useCallback(async () => {
    setIsLoadingSboms(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/sbom/repositories/${params.repositoryId}/sboms?page=0&size=50`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch SBOMs");
      const data = await res.json();
      setSboms(data.content || []);
      // For trend chart, fetch vulnerabilities for each SBOM
      const trendData = await Promise.all(
        (data.content || []).map(async (sbom: any) => {
          const res = await fetch(`${API_BASE_URL}/api/v1/sbom/${sbom.sbomId}/components`, { headers: getAuthHeaders() });
          if (!res.ok) return { commit: sbom.commit, createdAt: sbom.createdAt, vulnerabilities: 0 };
          const comps = await res.json();
          let vulnCount = 0;
          for (const c of comps) {
            vulnCount += c.vulnerabilities ? c.vulnerabilities.length : 0;
          }
          return { commit: sbom.commit, createdAt: sbom.createdAt, vulnerabilities: vulnCount };
        })
      );
      setTrend(trendData);
    } catch (err: any) {
      setSboms([]);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingSboms(false);
    }
  }, [params.repositoryId, getAuthHeaders, toast]);

  // Fetch component summary for a given SBOM
  const fetchComponentSummary = useCallback(async (sbomId: string, setSummary: (s: ComponentSummary[]) => void) => {
    setIsLoadingComparison(true);
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/v1/sbom/${sbomId}/components`,
        { headers: getAuthHeaders() }
      );
      if (!res.ok) throw new Error("Failed to fetch component summary");
      const data = await res.json();
      setSummary(
        data.map((c: any) => ({
          name: c.name,
          version: c.version,
          vulnerabilities: c.vulnerabilities ? c.vulnerabilities.length : 0
        }))
      );
    } catch (err: any) {
      setSummary([]);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoadingComparison(false);
    }
  }, [getAuthHeaders, toast]);

  useEffect(() => {
    fetchSboms();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (firstSbomId) fetchComponentSummary(firstSbomId, setFirstSummary);
    if (secondSbomId) fetchComponentSummary(secondSbomId, setSecondSummary);
  }, [firstSbomId, secondSbomId, fetchComponentSummary]);

  // Compare two SBOMs' components
  function getComparison() {
    const firstMap = new Map(firstSummary.map(c => [c.name + ":" + c.version, c]));
    const secondMap = new Map(secondSummary.map(c => [c.name + ":" + c.version, c]));
    const allKeys = new Set([...firstMap.keys(), ...secondMap.keys()]);
    const rows = [];
    for (const key of allKeys) {
      const c1 = firstMap.get(key);
      const c2 = secondMap.get(key);
      rows.push({
        name: key.split(":")[0],
        version1: c1?.version || "-",
        version2: c2?.version || "-",
        vulns1: c1?.vulnerabilities ?? 0,
        vulns2: c2?.vulnerabilities ?? 0,
        status: !c1 ? "Added" : !c2 ? "Removed" : c1.version !== c2.version ? "Changed" : "Unchanged"
      });
    }
    return rows;
  }

  return (
    <main className="min-h-screen flex flex-col bg-gray-50 dark:bg-black">
      <Navbar />
      <div className="container mx-auto py-8 max-w-7xl">
        <h1 className="text-3xl font-bold mb-2 text-center">Compare Builds</h1>
        <p className="text-center text-muted-foreground mb-4">Select two commits to compare their dependencies and vulnerabilities.</p>
        <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
          <div className="flex flex-col items-center">
            <Label htmlFor="first-sbom" className="font-semibold mb-2">First Commit</Label>
            {isLoadingSboms ? <Skeleton className="h-10 w-64 mt-2" /> : (
              <select
                id="first-sbom"
                className="w-64 mt-2 p-2 border rounded"
                value={firstSbomId || ""}
                onChange={e => setFirstSbomId(e.target.value)}
              >
                <option value="">Select...</option>
                {sboms.map(sbom => (
                  <option key={sbom.sbomId} value={sbom.sbomId}>
                    {sbom.commit} ({new Date(sbom.createdAt).toLocaleString()})
                  </option>
                ))}
              </select>
            )}
          </div>
          <div className="flex flex-col items-center">
            <Label htmlFor="second-sbom" className="font-semibold mb-2">Second Commit</Label>
            {isLoadingSboms ? <Skeleton className="h-10 w-64 mt-2" /> : (
              <select
                id="second-sbom"
                className="w-64 mt-2 p-2 border rounded"
                value={secondSbomId || ""}
                onChange={e => setSecondSbomId(e.target.value)}
              >
                <option value="">Select...</option>
                {sboms.map(sbom => (
                  <option key={sbom.sbomId} value={sbom.sbomId}>
                    {sbom.commit} ({new Date(sbom.createdAt).toLocaleString()})
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
        {/* Comparison Table */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Component Comparison</h2>
            {isLoadingComparison ? <Skeleton className="h-10 w-full" /> : (
              <table className="w-full text-left border">
                <thead>
                  <tr className="border-b">
                    <th className="p-2">Component</th>
                    <th className="p-2">First Version</th>
                    <th className="p-2">Second Version</th>
                    <th className="p-2">First Vulns</th>
                    <th className="p-2">Second Vulns</th>
                    <th className="p-2">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {firstSbomId && secondSbomId && getComparison().map((row, idx) => (
                    <tr key={idx} className="border-b">
                      <td className="p-2">{row.name}</td>
                      <td className="p-2">{row.version1}</td>
                      <td className="p-2">{row.version2}</td>
                      <td className="p-2">{row.vulns1}</td>
                      <td className="p-2">{row.vulns2}</td>
                      <td className="p-2">{row.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
        {/* Vulnerability Trend Chart */}
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Historical Vulnerability Trend</h2>
            {trend.length === 0 ? (
              <div className="text-muted-foreground text-center">No data available.</div>
            ) : (
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left border">
                  <thead>
                    <tr className="border-b">
                      <th className="p-2">Commit</th>
                      <th className="p-2">Date</th>
                      <th className="p-2">Vulnerabilities</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trend.map((t, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="p-2">{t.commit}</td>
                        <td className="p-2">{new Date(t.createdAt).toLocaleString()}</td>
                        <td className="p-2">{t.vulnerabilities}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
} 