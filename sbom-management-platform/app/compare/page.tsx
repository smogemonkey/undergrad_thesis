"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DependencyGraph } from "@/components/dependency-graph"
import { Download, FileText, ArrowLeftRight } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ComparePage() {
  const searchParams = useSearchParams()
  const [buildA, setBuildA] = useState(searchParams.get("buildA") || "jenkins-v2.387.3")
  const [buildB, setBuildB] = useState(searchParams.get("buildB") || "jenkins-v2.386.2")
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("summary")
  const { toast } = useToast()

  // Mock data for comparison
  const comparisonData = {
    summary: {
      added: 3,
      removed: 1,
      updated: 5,
      vulnerabilityChange: "+1",
    },
    added: [
      {
        id: 1,
        name: "spring-security-core",
        version: "5.7.3",
        license: "Apache-2.0",
        vulnerabilities: 0,
      },
      {
        id: 2,
        name: "jackson-databind",
        version: "2.13.4",
        license: "Apache-2.0",
        vulnerabilities: 2,
      },
      {
        id: 3,
        name: "commons-text",
        version: "1.9.0",
        license: "Apache-2.0",
        vulnerabilities: 1,
      },
    ],
    removed: [
      {
        id: 4,
        name: "commons-collections",
        version: "3.2.2",
        license: "Apache-2.0",
        vulnerabilities: 0,
      },
    ],
    updated: [
      {
        id: 5,
        name: "log4j-core",
        versionA: "2.17.1",
        versionB: "2.14.1",
        vulnerabilityChange: "+2",
      },
      {
        id: 6,
        name: "spring-core",
        versionA: "5.3.20",
        versionB: "5.3.18",
        vulnerabilityChange: "-1",
      },
      {
        id: 7,
        name: "guava",
        versionA: "31.1-jre",
        versionB: "30.1.1-jre",
        vulnerabilityChange: "0",
      },
      {
        id: 8,
        name: "commons-io",
        versionA: "2.11.0",
        versionB: "2.10.0",
        vulnerabilityChange: "0",
      },
      {
        id: 9,
        name: "netty-handler",
        versionA: "4.1.77",
        versionB: "4.1.75",
        vulnerabilityChange: "0",
      },
    ],
  }

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [buildA, buildB])

  const handleGenerateReport = () => {
    toast({
      title: "Report generated",
      description: `Comparison report for ${buildA} and ${buildB} has been generated.`,
    })
  }

  const handleExportData = () => {
    toast({
      title: "Data exported",
      description: `Comparison data has been exported as JSON.`,
    })
  }

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto py-6 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-lg">Loading comparison data...</p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Compare Builds</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportData}>
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button onClick={handleGenerateReport}>
              <FileText className="mr-2 h-4 w-4" />
              Generate Report
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center">
              <ArrowLeftRight className="mr-2 h-5 w-5" />
              Build Comparison
            </CardTitle>
            <CardDescription className="flex items-center justify-between">
              <span>
                Comparing <strong>{buildA}</strong> with <strong>{buildB}</strong>
              </span>
              <Badge variant="outline" className="ml-2">
                {new Date().toLocaleDateString()}
              </Badge>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Added Components</CardTitle>
                  <CardDescription>New components in Build A</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{comparisonData.summary.added}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Removed Components</CardTitle>
                  <CardDescription>Components removed from Build B</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{comparisonData.summary.removed}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Updated Components</CardTitle>
                  <CardDescription>Version changes between builds</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{comparisonData.summary.updated}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Vulnerability Change</CardTitle>
                  <CardDescription>Net change in vulnerabilities</CardDescription>
                </CardHeader>
                <CardContent>
                  <p
                    className={`text-3xl font-bold ${
                      comparisonData.summary.vulnerabilityChange.startsWith("+")
                        ? "text-red-600"
                        : comparisonData.summary.vulnerabilityChange.startsWith("-")
                          ? "text-green-600"
                          : ""
                    }`}
                  >
                    {comparisonData.summary.vulnerabilityChange}
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="summary">Summary</TabsTrigger>
            <TabsTrigger value="added">Added Components</TabsTrigger>
            <TabsTrigger value="removed">Removed Components</TabsTrigger>
            <TabsTrigger value="updated">Updated Components</TabsTrigger>
          </TabsList>

          <TabsContent value="summary" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Comparison Summary</CardTitle>
                <CardDescription>
                  Overview of changes between {buildA} and {buildB}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p>
                  This comparison shows that <strong>{buildA}</strong> has {comparisonData.summary.added} new
                  components, {comparisonData.summary.removed} removed components, and {comparisonData.summary.updated}{" "}
                  updated components compared to <strong>{buildB}</strong>.
                </p>
                <p>
                  The net change in vulnerabilities is{" "}
                  <span
                    className={
                      comparisonData.summary.vulnerabilityChange.startsWith("+")
                        ? "text-red-600 font-bold"
                        : comparisonData.summary.vulnerabilityChange.startsWith("-")
                          ? "text-green-600 font-bold"
                          : ""
                    }
                  >
                    {comparisonData.summary.vulnerabilityChange}
                  </span>
                  .
                </p>

                <div className="h-[400px] border rounded-lg p-4 bg-white">
                  <h3 className="text-lg font-medium mb-4">Dependency Graph Comparison</h3>
                  <DependencyGraph />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="added" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Added Components</CardTitle>
                <CardDescription>
                  Components present in {buildA} but not in {buildB}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Vulnerabilities</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.added.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">{component.name}</TableCell>
                        <TableCell>{component.version}</TableCell>
                        <TableCell>{component.license}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              component.vulnerabilities > 0
                                ? component.vulnerabilities > 1
                                  ? "bg-red-600"
                                  : "bg-orange-500"
                                : "bg-green-500"
                            }
                          >
                            {component.vulnerabilities}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="removed" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Removed Components</CardTitle>
                <CardDescription>
                  Components present in {buildB} but not in {buildA}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>Version</TableHead>
                      <TableHead>License</TableHead>
                      <TableHead>Vulnerabilities</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.removed.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">{component.name}</TableCell>
                        <TableCell>{component.version}</TableCell>
                        <TableCell>{component.license}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              component.vulnerabilities > 0
                                ? component.vulnerabilities > 1
                                  ? "bg-red-600"
                                  : "bg-orange-500"
                                : "bg-green-500"
                            }
                          >
                            {component.vulnerabilities}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="updated" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Updated Components</CardTitle>
                <CardDescription>Components with version changes between builds</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Component</TableHead>
                      <TableHead>{buildA} Version</TableHead>
                      <TableHead>{buildB} Version</TableHead>
                      <TableHead>Vulnerability Change</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.updated.map((component) => (
                      <TableRow key={component.id}>
                        <TableCell className="font-medium">{component.name}</TableCell>
                        <TableCell>{component.versionA}</TableCell>
                        <TableCell>{component.versionB}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              component.vulnerabilityChange.startsWith("+")
                                ? "bg-red-600"
                                : component.vulnerabilityChange.startsWith("-")
                                  ? "bg-green-500"
                                  : "bg-gray-500"
                            }
                          >
                            {component.vulnerabilityChange}
                          </Badge>
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
