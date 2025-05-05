"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { DependencyGraph } from "@/components/dependency-graph"
import { EnhancedNodeDetail } from "@/components/enhanced-node-detail"
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
} from "lucide-react"
import Link from "next/link"
import { useToast } from "@/hooks/use-toast"
// Import the AIComponentSummary component
import { AIComponentSummary } from "@/components/ai-component-summary"

export default function ComponentDetailsPage() {
  const params = useParams()
  const componentId = params.id
  const [component, setComponent] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedGraphNode, setSelectedGraphNode] = useState(null)
  const { toast } = useToast()

  useEffect(() => {
    // Simulate loading component data
    const timer = setTimeout(() => {
      // Mock component data
      setComponent({
        id: componentId,
        name: componentId === "log4j-core" ? "log4j-core" : "commons-text",
        version: componentId === "log4j-core" ? "2.14.1" : "1.9.0",
        description:
          componentId === "log4j-core"
            ? "Apache Log4j Core implementation, a widely used logging framework for Java"
            : "Apache Commons Text is a library focused on algorithms working on strings",
        group: "org.apache.logging.log4j",
        type: "jar",
        size: "1.7 MB",
        releaseDate: "2021-03-15",
        latestVersion: componentId === "log4j-core" ? "2.17.2" : "1.10.0",
        risk: componentId === "log4j-core" ? "critical" : "medium",
        vulnerabilities:
          componentId === "log4j-core"
            ? [
                {
                  id: "CVE-2021-44228",
                  severity: "Critical",
                  cvss: 10.0,
                  description: "Remote code execution vulnerability in Log4j",
                  published: "2021-12-10",
                  remediation: "Upgrade to Log4j 2.15.0 or later",
                  references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-44228"],
                },
                {
                  id: "CVE-2021-45046",
                  severity: "High",
                  cvss: 9.0,
                  description: "Denial of service vulnerability in Log4j",
                  published: "2021-12-14",
                  remediation: "Upgrade to Log4j 2.16.0 or later",
                  references: ["https://nvd.nist.gov/vuln/detail/CVE-2021-45046"],
                },
              ]
            : [
                {
                  id: "CVE-2022-42889",
                  severity: "Medium",
                  cvss: 6.6,
                  description:
                    "Apache Commons Text prior to 1.10.0 is vulnerable to RCE when applied to untrusted input due to insecure interpolation defaults",
                  published: "2022-10-13",
                  remediation: "Upgrade to Commons Text 1.10.0 or later",
                  references: ["https://nvd.nist.gov/vuln/detail/CVE-2022-42889"],
                },
              ],
        licenses: [
          {
            name: "Apache-2.0",
            compatible: true,
            risk: "low",
            url: "https://www.apache.org/licenses/LICENSE-2.0",
          },
        ],
        dependencies: [
          {
            id: "log4j-api",
            name: "log4j-api",
            version: "2.14.1",
            risk: "high",
          },
          {
            id: "jackson-core",
            name: "jackson-core",
            version: "2.12.3",
            risk: "medium",
          },
          {
            id: "netty",
            name: "netty",
            version: "4.1.65",
            risk: "medium",
          },
        ],
        dependents: [
          {
            id: "jenkins-core",
            name: "jenkins-core",
            version: "2.387.3",
            risk: "safe",
          },
          {
            id: "spring-core",
            name: "spring-core",
            version: "5.3.20",
            risk: "safe",
          },
        ],
        history: [
          {
            version: componentId === "log4j-core" ? "2.17.2" : "1.10.0",
            date: "2022-01-15",
            vulnerabilities: 0,
            changes: ["Security fixes", "Performance improvements"],
          },
          {
            version: componentId === "log4j-core" ? "2.17.1" : "1.9.0",
            date: "2021-12-28",
            vulnerabilities: 0,
            changes: ["Fixed CVE-2021-44832", "Minor bug fixes"],
          },
          {
            version: componentId === "log4j-core" ? "2.17.0" : "1.8.0",
            date: "2021-12-18",
            vulnerabilities: 0,
            changes: ["Security enhancements", "API improvements"],
          },
          {
            version: componentId === "log4j-core" ? "2.16.0" : "1.7.0",
            date: "2021-12-15",
            vulnerabilities: 1,
            changes: ["Fixed CVE-2021-45046", "Removed JNDI functionality"],
          },
          {
            version: componentId === "log4j-core" ? "2.15.0" : "1.6.0",
            date: "2021-12-11",
            vulnerabilities: 1,
            changes: ["Fixed CVE-2021-44228", "JNDI lookup pattern disabled by default"],
          },
          {
            version: componentId === "log4j-core" ? "2.14.1" : "1.5.0",
            date: "2021-03-15",
            vulnerabilities: 2,
            changes: ["Bug fixes", "Performance improvements"],
          },
        ],
        usedIn: [
          {
            project: "Jenkins",
            version: "2.387.3",
            path: "jenkins-core > log4j-core",
          },
          {
            project: "Spring Boot",
            version: "2.7.0",
            path: "spring-core > log4j-core",
          },
          {
            project: "Kubernetes",
            version: "1.26",
            path: "k8s-api > log4j-core",
          },
        ],
        securityMetrics: {
          vulnerabilityDensity: 1.18, // vulnerabilities per 1000 lines of code
          fixableVulnerabilities: 2,
          meanTimeToRemediate: "35 days",
          exploitMaturity: "High",
          attackVector: "Network",
          attackComplexity: "Low",
        },
      })
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [componentId])

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({
      title: "Link copied",
      description: "Component link has been copied to clipboard",
    })
  }

  const handleDownloadSBOM = () => {
    toast({
      title: "SBOM downloaded",
      description: `SBOM for ${componentId} has been downloaded`,
    })
  }

  const handleNodeSelect = (node) => {
    setSelectedGraphNode(node)
  }

  const handleFocusNode = (nodeId) => {
    toast({
      title: "Node focused",
      description: `Focused on node ${nodeId}`,
    })
  }

  const handleHighlightPath = (nodeId) => {
    toast({
      title: "Path highlighted",
      description: `Highlighted paths to node ${nodeId}`,
    })
  }

  const handleShowDependencies = (nodeId) => {
    toast({
      title: "Dependencies shown",
      description: `Showing dependencies of ${nodeId}`,
    })
  }

  const handleShowDependents = (nodeId) => {
    toast({
      title: "Dependents shown",
      description: `Showing dependents of ${nodeId}`,
    })
  }

  const getRiskColor = (risk) => {
    switch (risk) {
      case "critical":
        return "bg-red-600"
      case "high":
        return "bg-red-500"
      case "medium":
        return "bg-orange-500"
      case "low":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

  const getSeverityColor = (severity) => {
    switch (severity) {
      case "Critical":
        return "bg-red-600"
      case "High":
        return "bg-red-500"
      case "Medium":
        return "bg-orange-500"
      case "Low":
        return "bg-yellow-500"
      default:
        return "bg-blue-500"
    }
  }

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

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6">
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
                <div className={`p-2 rounded-md ${getRiskColor(component.risk)}`}>
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
              <Badge className={getRiskColor(component.risk)}>
                {component.risk.charAt(0).toUpperCase() + component.risk.slice(1)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">{component.description}</p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="space-y-1">
                <p className="text-xs text-gray-500">Group</p>
                <p className="text-sm font-medium">{component.group}</p>
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
                      component.vulnerabilities.length > 0 ? "text-red-500" : "text-green-500"
                    }`}
                  />
                  {component.vulnerabilities.length}
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
                <p className="text-sm font-medium">{component.licenses[0].name}</p>
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
            <AIComponentSummary component={component} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Shield className="mr-2 h-5 w-5" />
                    Vulnerability Summary
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {component.vulnerabilities.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Critical</span>
                          <span>{component.vulnerabilities.filter((v) => v.severity === "Critical").length}</span>
                        </div>
                        <Progress
                          value={
                            (component.vulnerabilities.filter((v) => v.severity === "Critical").length /
                              component.vulnerabilities.length) *
                            100
                          }
                          className="h-2"
                          indicatorClassName="bg-red-600"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>High</span>
                          <span>{component.vulnerabilities.filter((v) => v.severity === "High").length}</span>
                        </div>
                        <Progress
                          value={
                            (component.vulnerabilities.filter((v) => v.severity === "High").length /
                              component.vulnerabilities.length) *
                            100
                          }
                          className="h-2"
                          indicatorClassName="bg-red-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Medium</span>
                          <span>{component.vulnerabilities.filter((v) => v.severity === "Medium").length}</span>
                        </div>
                        <Progress
                          value={
                            (component.vulnerabilities.filter((v) => v.severity === "Medium").length /
                              component.vulnerabilities.length) *
                            100
                          }
                          className="h-2"
                          indicatorClassName="bg-orange-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Low</span>
                          <span>{component.vulnerabilities.filter((v) => v.severity === "Low").length}</span>
                        </div>
                        <Progress
                          value={
                            (component.vulnerabilities.filter((v) => v.severity === "Low").length /
                              component.vulnerabilities.length) *
                            100
                          }
                          className="h-2"
                          indicatorClassName="bg-yellow-500"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <Shield className="h-12 w-12 text-green-500 mb-2" />
                      <p className="text-green-600 font-medium">No vulnerabilities found</p>
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <Card className="h-full">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center">
                      <GitFork className="mr-2 h-5 w-5" />
                      Dependency Graph
                    </CardTitle>
                    <CardDescription>
                      Hover over nodes to see details and click to view component information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px]">
                    <DependencyGraph />
                  </CardContent>
                </Card>
              </div>

              <div>
                <EnhancedNodeDetail
                  selectedNode={selectedGraphNode}
                  onFocusNode={handleFocusNode}
                  onHighlightPath={handleHighlightPath}
                  onShowDependencies={handleShowDependencies}
                  onShowDependents={handleShowDependents}
                />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vulnerabilities" className="mt-4 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Vulnerabilities
                </CardTitle>
                <CardDescription>
                  {component.vulnerabilities.length > 0
                    ? `${component.vulnerabilities.length} vulnerabilities found in this component`
                    : "No vulnerabilities found in this component"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {component.vulnerabilities.length > 0 ? (
                  <Accordion type="single" collapsible className="w-full">
                    {component.vulnerabilities.map((vuln) => (
                      <AccordionItem key={vuln.id} value={vuln.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex items-center justify-between w-full pr-4">
                            <div className="flex items-center">
                              <Badge className={`mr-3 ${getSeverityColor(vuln.severity)}`}>{vuln.severity}</Badge>
                              <span className="font-mono">{vuln.id}</span>
                            </div>
                            <Badge variant="outline">CVSS {vuln.cvss}</Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-4 pt-2">
                            <p className="text-sm">{vuln.description}</p>

                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <h4 className="text-sm font-medium mb-1">Published</h4>
                                <p className="text-sm text-gray-600">{vuln.published}</p>
                              </div>
                              <div>
                                <h4 className="text-sm font-medium mb-1">CVSS Score</h4>
                                <div className="flex items-center gap-2">
                                  <Progress
                                    value={vuln.cvss * 10}
                                    className="h-2"
                                    indicatorClassName={getSeverityColor(vuln.severity)}
                                  />
                                  <span className="text-sm font-medium">{vuln.cvss}</span>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-1">Remediation</h4>
                              <p className="text-sm text-gray-600">{vuln.remediation}</p>
                            </div>

                            <div>
                              <h4 className="text-sm font-medium mb-1">References</h4>
                              <ul className="list-disc list-inside text-sm text-gray-600">
                                {vuln.references.map((ref, index) => (
                                  <li key={index}>
                                    <a
                                      href={ref}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center"
                                    >
                                      {ref.replace("https://", "").split("/").slice(0, 3).join("/")}...
                                      <ExternalLink className="h-3 w-3 ml-1" />
                                    </a>
                                  </li>
                                ))}
                              </ul>
                              {/* Add direct link to NVD */}
                              <a
                                href={`https://nvd.nist.gov/vuln/detail/${vuln.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline flex items-center mt-2"
                              >
                                View on NVD Database
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </a>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
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
                <CardDescription>
                  Visual representation of dependencies. Click on nodes to view details.
                </CardDescription>
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
                      {component.risk === "critical" || component.risk === "high" ? "High" : "Low"}
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
                      className="h-2"
                      indicatorClassName="bg-red-500"
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
                        (component.securityMetrics.fixableVulnerabilities / component.vulnerabilities.length) * 100
                      }
                      className="h-2"
                      indicatorClassName="bg-green-500"
                    />
                    <p className="text-xs text-gray-500">Vulnerabilities that can be fixed by upgrading</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Mean Time to Remediate</span>
                      <span className="text-sm font-medium">{component.securityMetrics.meanTimeToRemediate}</span>
                    </div>
                    <Progress value={70} className="h-2" indicatorClassName="bg-orange-500" />
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
                    <p className="text-sm font-medium capitalize">{component.risk}</p>
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
      </div>
    </main>
  )
}
