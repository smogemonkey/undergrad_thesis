"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Package, AlertTriangle, FileText } from "lucide-react"
import Link from "next/link"

export default function ComponentsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState("all")
  const [components, setComponents] = useState([])
  const [filteredComponents, setFilteredComponents] = useState([])
  // Add license type filter
  const [licenseFilter, setLicenseFilter] = useState("all")

  useEffect(() => {
    // Simulate loading component data
    const timer = setTimeout(() => {
      const mockComponents = [
        {
          id: "log4j-core",
          name: "log4j-core",
          version: "2.14.1",
          group: "org.apache.logging.log4j",
          risk: "critical",
          vulnerabilities: 2,
          license: "Apache-2.0",
          usedIn: 3,
        },
        {
          id: "commons-text",
          name: "commons-text",
          version: "1.9.0",
          group: "org.apache.commons",
          risk: "medium",
          vulnerabilities: 1,
          license: "Apache-2.0",
          usedIn: 2,
        },
        {
          id: "spring-core",
          name: "spring-core",
          version: "5.3.20",
          group: "org.springframework",
          risk: "low",
          vulnerabilities: 0,
          license: "Apache-2.0",
          usedIn: 5,
        },
        {
          id: "jackson-databind",
          name: "jackson-databind",
          version: "2.13.4",
          group: "com.fasterxml.jackson.core",
          risk: "high",
          vulnerabilities: 2,
          license: "Apache-2.0",
          usedIn: 4,
        },
        {
          id: "guava",
          name: "guava",
          version: "31.1-jre",
          group: "com.google.guava",
          risk: "safe",
          vulnerabilities: 0,
          license: "Apache-2.0",
          usedIn: 6,
        },
        {
          id: "netty",
          name: "netty",
          version: "4.1.65",
          group: "io.netty",
          risk: "medium",
          vulnerabilities: 1,
          license: "Apache-2.0",
          usedIn: 3,
        },
        {
          id: "commons-io",
          name: "commons-io",
          version: "2.11.0",
          group: "commons-io",
          risk: "safe",
          vulnerabilities: 0,
          license: "Apache-2.0",
          usedIn: 7,
        },
      ]
      setComponents(mockComponents)
      setFilteredComponents(mockComponents)
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Filter components based on search query, risk filter, and license filter
    const filtered = components.filter((component) => {
      const matchesSearch =
        searchQuery === "" ||
        component.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        component.group.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesRisk = riskFilter === "all" || component.risk === riskFilter

      const matchesLicense = licenseFilter === "all" || component.license === licenseFilter

      return matchesSearch && matchesRisk && matchesLicense
    })

    setFilteredComponents(filtered)
  }, [searchQuery, riskFilter, licenseFilter, components])

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

  if (isLoading) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto py-6 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-4 text-lg">Loading components...</p>
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
          <h1 className="text-2xl font-bold">Components</h1>
          <Button>
            <Package className="mr-2 h-4 w-4" />
            Add Component
          </Button>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle>Component Inventory</CardTitle>
            <CardDescription>Browse and search all components in your software supply chain</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  placeholder="Search components..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <Select value={riskFilter} onValueChange={setRiskFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by risk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Risks</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="safe">Safe</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <Select value={licenseFilter} onValueChange={setLicenseFilter}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Filter by license" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Licenses</SelectItem>
                    <SelectItem value="Apache-2.0">Apache 2.0</SelectItem>
                    <SelectItem value="MIT">MIT</SelectItem>
                    <SelectItem value="GPL-3.0">GPL 3.0</SelectItem>
                    <SelectItem value="BSD-3-Clause">BSD 3-Clause</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Vulnerabilities</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>Used In</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredComponents.map((component) => (
                    <TableRow key={component.id}>
                      <TableCell className="font-medium">
                        <Link href={`/components/${component.id}`} className="hover:underline text-blue-600">
                          {component.name}
                        </Link>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{component.group}</TableCell>
                      <TableCell>{component.version}</TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(component.risk)}>
                          {component.risk.charAt(0).toUpperCase() + component.risk.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {component.vulnerabilities > 0 ? (
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                            {component.vulnerabilities}
                          </div>
                        ) : (
                          <span className="text-green-500">0</span>
                        )}
                      </TableCell>
                      <TableCell>{component.license}</TableCell>
                      <TableCell>{component.usedIn} projects</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
