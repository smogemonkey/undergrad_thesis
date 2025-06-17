"use client"

import React, { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DependencyGraph } from "@/components/dependency-graph"
import {
  ArrowLeft,
  ExternalLink,
  Package,
  Shield,
  AlertTriangle,
  GitBranch,
  Tag,
  FileText,
  Download,
  Share2,
  BarChart3,
  Building2,
  GitFork,
  Loader2,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"

import { aiService, AiRemediationResponse, AiAlternativeResponse } from "@/services/aiService"
import { useAuth } from '@/contexts/AuthContext'
import { AiRemediationModal } from "@/components/AiRemediationModal"
import { AiSuggestionModal } from "@/components/AiSuggestionModal"

interface ComponentResponseDto {
  id: string;
  name: string;
  version: string;
  groupName: string;
  type: string;
  purl: string;
  description: string;
  packageUrl: string;
  license: string;
  hash: string;
  evidence: string;
  riskLevel: string;
  vulnerabilityIds: string[];
  latestVersion: string;
  size: number;
  releaseDate: string;
  dependencies: Array<{
    id: string;
    name: string;
    version: string;
    risk: string;
  }>;
  dependents: Array<{
    id: string;
    name: string;
    version: string;
    risk: string;
  }>;
  references: string[];
  securityMetrics: {
    fixableVulnerabilities: number;
    vulnerabilityDensity: number;
    meanTimeToRemediate: string;
    exploitMaturity: string;
    attackVector: string;
    attackComplexity: string;
  };
  history: Array<{
    version: string;
    date: string;
    vulnerabilities: number;
    changes: string[];
  }>;
  usedIn: Array<{
    project: string;
    version: string;
    path: string;
  }>;
  licenses: Array<{
    name: string;
    compatible: boolean;
    risk: string;
    url: string;
  }>;
}

interface Vulnerability {
  id: string;
  title: string;
  description: string;
  severity: string;
  cvssScore: number;
  publishedDate: string;
  lastModifiedDate: string;
}

export default function ComponentDetailsPage() {
  const params = useParams()
  const componentId = params.id
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [component, setComponent] = useState<ComponentResponseDto | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [isAiRemediationModalOpen, setIsAiRemediationModalOpen] = useState(false)
  const [selectedVulnerability, setSelectedVulnerability] = useState<string | null>(null)
  const [aiRemediationData, setAiRemediationData] = useState<AiRemediationResponse | null>(null)
  const [isAiRemediationLoading, setIsAiRemediationLoading] = useState(false)
  const [aiRemediationError, setAiRemediationError] = useState<string | null>(null)
  const [isAiSuggestionModalOpen, setIsAiSuggestionModalOpen] = useState(false)
  const [aiSuggestionData, setAiSuggestionData] = useState<AiAlternativeResponse | null>(null)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    const fetchComponentData = async () => {
      try {
        setIsLoading(true)
        const token = localStorage.getItem('token')
        if (!token) {
          throw new Error('No authentication token found')
        }

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/components/${componentId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          if (response.status === 404) {
            router.push('/components')
            toast({
              title: 'Error',
              description: 'Component not found',
              variant: 'destructive',
            })
            return
          }
          throw new Error('Failed to fetch component data')
        }

        const data = await response.json()
        setComponent(data)
      } catch (error) {
        console.error('Error fetching component data:', error)
        toast({
          title: 'Error',
          description: 'Failed to load component data',
          variant: 'destructive',
        })
        router.push('/components')
      } finally {
        setIsLoading(false)
      }
    }

    if (componentId) {
      fetchComponentData()
    }
  }, [componentId, toast, router, user])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "Component link has been copied to clipboard",
    })
  }

  const handleDownloadSBOM = async () => {
    if (!component) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/sbom/${componentId}/download`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to download SBOM');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${component.name}-${component.version}-sbom.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Success",
        description: `SBOM for ${component.name} has been downloaded`,
      });
    } catch (error) {
      console.error('Error downloading SBOM:', error);
      toast({
        title: 'Error',
        description: 'Failed to download SBOM',
        variant: 'destructive',
      });
    }
  };

  const getRiskColor = (risk: string): string => {
    switch (risk.toLowerCase()) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  }

  const handleGetAiRemediation = async (vulnId: string) => {
    if (!component) return;
    
    setSelectedVulnerability(vulnId);
    setIsAiRemediationModalOpen(true);
    setIsAiRemediationLoading(true);
    setAiRemediationError(null);

    try {
      const response = await aiService.getRemediationSuggestion({
        vulnerabilityDbId: vulnId,
        affectedComponentPurl: component.purl,
        affectedComponentVersion: component.version,
        buildIdContext: params.buildId as string,
        projectContextDescription: `Component ${component.name} version ${component.version} used in the project`
      });

      setAiRemediationData(response);
    } catch (error) {
      console.error('Error getting AI remediation:', error);
      setAiRemediationError(error instanceof Error ? error.message : 'Failed to get AI remediation suggestions');
      toast({
        title: 'Error',
        description: 'Failed to get AI remediation suggestions',
        variant: 'destructive',
      });
    } finally {
      setIsAiRemediationLoading(false);
    }
  };

  const handleGetAiSuggestion = async (component: ComponentResponseDto) => {
    try {
      setIsAiRemediationLoading(true);
      const response = await aiService.suggestAlternativePackages({
        componentPurl: component.purl,
        currentVersion: component.version,
        mainUsageDescription: component.description || `Component ${component.name} version ${component.version}`,
        desiredCharacteristics: [
          'Better security track record',
          'Active maintenance',
          'Compatible with current version'
        ],
        constraints: [
          'Must maintain similar functionality',
          'Must be compatible with existing dependencies'
        ]
      });

      setAiSuggestionData(response);
      setIsAiSuggestionModalOpen(true);
    } catch (error) {
      console.error('Error getting AI suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to get AI suggestions',
        variant: 'destructive',
      });
    } finally {
      setIsAiRemediationLoading(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto py-6 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-lg">Loading component details...</p>
          </div>
        </div>
      </main>
    )
  }

  if (!component) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto py-6 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <p className="text-lg">Component not found</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/">
              <Button variant="outline" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold">Component Details</h1>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleGetAiRemediation(component.vulnerabilityIds[0])}
              disabled={component.vulnerabilityIds.length === 0}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Remediation
            </Button>
            <Button 
              variant="outline" 
              onClick={() => handleGetAiSuggestion(component)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              AI Suggestion
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share
            </Button>
            <Button variant="outline" onClick={handleDownloadSBOM}>
              <Download className="mr-2 h-4 w-4" />
              Download SBOM
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-md ${getRiskColor(component.riskLevel)}`}>
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle className="text-xl">{component.name}</CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <Tag className="h-3 w-3" />v{component.version}
                    {component.version !== component.latestVersion && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Latest: v{component.latestVersion}
                      </Badge>
                    )}
                  </CardDescription>
                </div>
              </div>
              <Badge className={getRiskColor(component.riskLevel)}>
                {component.riskLevel.charAt(0).toUpperCase() + component.riskLevel.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{component.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Group</p>
                <p className="text-sm font-medium">{component.groupName}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Type</p>
                <p className="text-sm font-medium">{component.type}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Size</p>
                <p className="text-sm font-medium">{component.size}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Release Date</p>
                <p className="text-sm font-medium">{component.releaseDate}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Vulnerabilities</p>
                <p className="text-sm font-medium flex items-center">
                  <AlertTriangle
                    className={`h-4 w-4 mr-1 ${
                      component.vulnerabilityIds.length > 0 ? "text-red-500" : "text-green-500"
                    }`}
                  />
                  {component.vulnerabilityIds.length}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Dependencies</p>
                <p className="text-sm font-medium">{component.dependencies.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Dependents</p>
                <p className="text-sm font-medium">{component.dependents.length}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-gray-500">License</p>
                <p className="text-sm font-medium">{component.license}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 md:grid-cols-6 w-full">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            {/* <AIComponentSummary component={component} /> */}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Vulnerability Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {component.vulnerabilityIds.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Critical</span>
                          <span>{component.vulnerabilityIds.filter((v) => v === "Critical").length}</span>
                        </div>
                        <Progress
                          value={
                            (component.vulnerabilityIds.filter((v) => v === "Critical").length /
                              component.vulnerabilityIds.length) *
                            100
                          }
                          className="h-2 bg-red-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>High</span>
                          <span>{component.vulnerabilityIds.filter((v) => v === "High").length}</span>
                        </div>
                        <Progress
                          value={
                            (component.vulnerabilityIds.filter((v) => v === "High").length /
                              component.vulnerabilityIds.length) *
                            100
                          }
                          className="h-2 bg-red-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Medium</span>
                          <span>{component.vulnerabilityIds.filter((v) => v === "Medium").length}</span>
                        </div>
                        <Progress
                          value={
                            (component.vulnerabilityIds.filter((v) => v === "Medium").length /
                              component.vulnerabilityIds.length) *
                            100
                          }
                          className="h-2 bg-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Low</span>
                          <span>{component.vulnerabilityIds.filter((v) => v === "Low").length}</span>
                        </div>
                        <Progress
                          value={
                            (component.vulnerabilityIds.filter((v) => v === "Low").length /
                              component.vulnerabilityIds.length) *
                            100
                          }
                          className="h-2 bg-yellow-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <Shield className="h-12 w-12 text-green-500 mb-2" />
                      <p className="text-green-600 font-medium">No vulnerabilities found</p>
                      <p className="mt-4 text-lg">Loading component details...</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <GitBranch className="mr-2 h-5 w-5" />
                    Version History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {component.history.slice(0, 4).map((version) => (
                      <div key={version.version} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div
                            className={`w-2 h-2 rounded-full ${
                              version.vulnerabilities > 0 ? "bg-red-500" : "bg-green-500"
                            }`}
                          ></div>
                          <div>
                            <p className="text-sm font-medium">v{version.version}</p>
                            <p className="text-xs text-gray-500">{version.date}</p>
                          </div>
                        </div>
                        {version.vulnerabilities > 0 && <Badge className="bg-red-500">{version.vulnerabilities}</Badge>}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="w-full text-xs">
                      View all versions
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <GitFork className="mr-2 h-5 w-5" />
                  Dependency Graph
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[400px]">
                <DependencyGraph />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Vulnerabilities
                </CardTitle>
                <CardDescription>
                  {component.vulnerabilityIds.length > 0
                    ? `${component.vulnerabilityIds.length} vulnerabilities found in this component`
                    : "No vulnerabilities found in this component"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {component.vulnerabilityIds.length > 0 ? (
                  <div className="space-y-4">
                    {component.vulnerabilityIds.map((vulnId) => (
                      <div key={vulnId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <h3 className="text-lg font-medium">{vulnId}</h3>
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 text-sm rounded-full ${getRiskColor(component.riskLevel)} text-white`}>
                              {component.riskLevel}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleGetAiRemediation(vulnId)}
                            >
                              Get AI Remediation
                            </Button>
                          </div>
                        </div>
                        <p className="text-gray-600 mt-2">
                          {component.description || 'No description available'}
                        </p>
                        <div className="mt-4">
                          <a
                            href={`https://nvd.nist.gov/vuln/detail/${vulnId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:text-blue-700"
                          >
                            View on NVD
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Shield className="h-16 w-16 text-green-500 mb-4" />
                    <p className="text-lg font-medium text-green-600">No vulnerabilities found</p>
                    <p className="text-sm text-gray-500 mt-2 max-w-md text-center">
                      This component has no known vulnerabilities. Regular security scans are performed to ensure this
                      status is up to date.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dependencies" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dependencies</CardTitle>
                  <CardDescription>Components that this component depends on</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {component.dependencies.map((dep) => (
                        <TableRow key={dep.id}>
                          <TableCell className="font-medium">
                            <Link href={`/components/${dep.id}`} className="hover:underline text-blue-600">
                              {dep.name}
                            </Link>
                          </TableCell>
                          <TableCell>{dep.version}</TableCell>
                          <TableCell>
                            <Badge className={getRiskColor(dep.risk)}>
                              {dep.risk.charAt(0).toUpperCase() + dep.risk.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Dependents</CardTitle>
                  <CardDescription>Components that depend on this component</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Component</TableHead>
                        <TableHead>Version</TableHead>
                        <TableHead>Risk</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {component.dependents.map((dep) => (
                        <TableRow key={dep.id}>
                          <TableCell className="font-medium">
                            <Link href={`/components/${dep.id}`} className="hover:underline text-blue-600">
                              {dep.name}
                            </Link>
                          </TableCell>
                          <TableCell>{dep.version}</TableCell>
                          <TableCell>
                            <Badge className={getRiskColor(dep.risk)}>
                              {dep.risk.charAt(0).toUpperCase() + dep.risk.slice(1)}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dependency Graph</CardTitle>
                <CardDescription>Visual representation of dependencies</CardDescription>
              </CardHeader>
              <CardContent className="h-[400px]">
                <DependencyGraph />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="versions" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <GitBranch className="mr-2 h-5 w-5" />
                  Version History
                </CardTitle>
                <CardDescription>Release history and changes over time</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Version</TableHead>
                      <TableHead>Release Date</TableHead>
                      <TableHead>Vulnerabilities</TableHead>
                      <TableHead>Changes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {component.history.map((version) => (
                      <TableRow key={version.version}>
                        <TableCell className="font-medium">v{version.version}</TableCell>
                        <TableCell>{version.date}</TableCell>
                        <TableCell>
                          {version.vulnerabilities > 0 ? (
                            <Badge className="bg-red-500">{version.vulnerabilities}</Badge>
                          ) : (
                            <Badge className="bg-green-500">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <ul className="list-disc list-inside text-sm">
                            {version.changes.map((change, index) => (
                              <li key={index}>{change}</li>
                            ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Version Comparison</CardTitle>
                <CardDescription>Compare vulnerabilities across versions</CardDescription>
              </CardHeader>
              <CardContent className="h-[300px]">
                <div className="flex items-center justify-center h-full">
                  <BarChart3 className="h-16 w-16 text-gray-300" />
                  <p className="text-gray-500 ml-4">Version comparison chart would be displayed here</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="mr-2 h-5 w-5" />
                  Projects Using This Component
                </CardTitle>
                <CardDescription>Projects that include this component in their dependencies</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Project</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>Dependency Path</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {component.usedIn.map((usage, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{usage.project}</TableCell>
                        <TableCell>{usage.version}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-gray-100 p-1 rounded">{usage.path}</code>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Statistics</CardTitle>
                <CardDescription>How widely this component is used across projects</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold">{component.usedIn.length}</p>
                    <p className="text-sm text-gray-500">Projects</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold">
                      {component.usedIn.reduce((acc, curr) => acc + curr.path.split(">").length, 0)}
                    </p>
                    <p className="text-sm text-gray-500">Dependency Paths</p>
                  </div>
                  <div className="border rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold">
                      {component.riskLevel === "critical" || component.riskLevel === "high" ? "High" : "Low"}
                    </p>
                    <p className="text-sm text-gray-500">Impact</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Security Metrics</CardTitle>
                <CardDescription>Key security indicators for this component</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Vulnerability Density</span>
                      <span className="text-sm font-medium">{component.securityMetrics.vulnerabilityDensity}</span>
                    </div>
                    <Progress
                      value={(component.securityMetrics.vulnerabilityDensity / 2) * 100}
                      className="h-2 bg-red-500"
                    />
                    <p className="text-xs text-gray-500">Vulnerabilities per 1000 lines of code</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Fixable Vulnerabilities</span>
                      <span className="text-sm font-medium">{component.securityMetrics.fixableVulnerabilities}</span>
                    </div>
                    <Progress
                      value={
                        (component.securityMetrics.fixableVulnerabilities / component.vulnerabilityIds.length) * 100
                      }
                      className="h-2 bg-green-500"
                    />
                    <p className="text-xs text-gray-500">Vulnerabilities that can be fixed by upgrading</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Mean Time to Remediate</span>
                      <span className="text-sm font-medium">{component.securityMetrics.meanTimeToRemediate}</span>
                    </div>
                    <Progress
                      value={70}
                      className="h-2 bg-orange-500"
                    />
                    <p className="text-xs text-gray-500">Average time to fix vulnerabilities</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-500">Exploit Maturity</p>
                    <p className="text-sm font-medium">{component.securityMetrics.exploitMaturity}</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-500">Attack Vector</p>
                    <p className="text-sm font-medium">{component.securityMetrics.attackVector}</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-500">Attack Complexity</p>
                    <p className="text-sm font-medium">{component.securityMetrics.attackComplexity}</p>
                  </div>
                  <div className="border rounded-lg p-3">
                    <p className="text-xs text-gray-500">Overall Risk</p>
                    <p className="text-sm font-medium capitalize">{component.riskLevel}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">License Compliance</CardTitle>
                <CardDescription>License information and compatibility</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>License</TableHead>
                      <TableHead>Compatibility</TableHead>
                      <TableHead>Risk</TableHead>
                      <TableHead>Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {component.licenses.map((license, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{license.name}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              license.compatible ? "border-green-500 text-green-500" : "border-red-500 text-red-500"
                            }
                          >
                            {license.compatible ? "Compatible" : "Incompatible"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={
                              license.risk === "high"
                                ? "border-red-500 text-red-500"
                                : license.risk === "medium"
                                  ? "border-orange-500 text-orange-500"
                                  : "border-green-500 text-green-500"
                            }
                          >
                            {license.risk.charAt(0).toUpperCase() + license.risk.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={license.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center"
                            >
                              <FileText className="h-3 w-3 mr-1" />
                              View
                            </a>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {selectedVulnerability && component && (
          <AiRemediationModal
            isOpen={isAiRemediationModalOpen}
            onClose={() => {
              setIsAiRemediationModalOpen(false);
              setSelectedVulnerability(null);
              setAiRemediationData(null);
              setAiRemediationError(null);
            }}
            vulnerabilityId={selectedVulnerability}
            componentName={component.name}
            componentPurl={component.purl}
            componentVersion={component.version}
            buildIdContext={params.buildId as string}
          />
        )}

        {isAiSuggestionModalOpen && (
          <AiSuggestionModal
            isOpen={isAiSuggestionModalOpen}
            onClose={() => {
              setIsAiSuggestionModalOpen(false);
              setAiSuggestionData(null);
            }}
            suggestionData={aiSuggestionData}
          />
        )}
      </main>
    </div>
  )
}
