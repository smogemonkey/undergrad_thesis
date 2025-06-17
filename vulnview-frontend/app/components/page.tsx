"use client"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, Package, AlertTriangle, FileText, Download, Sparkles } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

const API_BASE_URL = "http://localhost:8080"

// Define the Component type for strong typing
interface Component {
  id: string;
  name: string;
  version: string;
  group?: string;
  groupName?: string;
  riskLevel?: string;
  vulnerabilities?: any[];
  license?: string;
}

export default function ComponentsPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string>("")
  const [searchQuery, setSearchQuery] = useState("")
  const [riskFilter, setRiskFilter] = useState("all")
  const [licenseFilter, setLicenseFilter] = useState("all")
  const [components, setComponents] = useState<Component[]>([])
  const [filteredComponents, setFilteredComponents] = useState<Component[]>([])
  const [summary, setSummary] = useState<any>(null)
  const [aiSuggestions, setAiSuggestions] = useState<Record<string, any>>({})
  const [exporting, setExporting] = useState(false)

  // Fetch components and summary from backend
  useEffect(() => {
    const fetchData = async () => {
    setIsLoading(true)
      setError("")
      try {
        // You may want to get sbomId from route or context; here we use 1 as example
        const sbomId = 1
        const res = await fetch(`${API_BASE_URL}/api/v1/sbom/${sbomId}/components`, {
      headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        })
        if (!res.ok) throw new Error('Failed to fetch components')
        const data = await res.json()
        setComponents(data.components || [])
        setFilteredComponents(data.components || [])
        setSummary(data.summary || null)
      } catch (err: any) {
        setError(err.message || 'Failed to load components')
        setComponents([])
        setFilteredComponents([])
        setSummary(null)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // Filtering logic
  useEffect(() => {
    const filtered = components.filter((component) => {
      const matchesSearch =
        searchQuery === "" ||
        (component.name && component.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (component.group && component.group.toLowerCase().includes(searchQuery.toLowerCase()))
      const matchesRisk = riskFilter === "all" || (component.riskLevel && component.riskLevel.toLowerCase() === riskFilter)
      const matchesLicense = licenseFilter === "all" || (component.license && component.license === licenseFilter)
      return matchesSearch && matchesRisk && matchesLicense
    })
    setFilteredComponents(filtered)
  }, [searchQuery, riskFilter, licenseFilter, components])

  // AI Remediation fetch
  const fetchAiRemediation = async (component: Component) => {
    try {
      setAiSuggestions((prev) => ({ ...prev, [component.id]: { loading: true } }))
      const res = await fetch(`${API_BASE_URL}/api/ai/remediation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          componentId: component.id,
          vulnerabilities: component.vulnerabilities || [],
        })
      })
      if (!res.ok) throw new Error('Failed to fetch AI remediation')
      const data = await res.json()
      setAiSuggestions((prev) => ({ ...prev, [component.id]: { suggestion: data.suggestion, loading: false } }))
    } catch (err: any) {
      setAiSuggestions((prev) => ({ ...prev, [component.id]: { error: err.message, loading: false } }))
      toast.error('Failed to fetch AI remediation')
    }
  }

  // Export logic
  const exportData = (format: string) => {
    setExporting(true)
    try {
      let dataStr = ''
      if (format === 'csv') {
        const header = ['Name', 'Group', 'Version', 'Risk', 'Vulnerabilities', 'License']
        const rows = filteredComponents.map(c => [
          c.name,
          c.group || '',
          c.version,
          c.riskLevel,
          c.vulnerabilities ? c.vulnerabilities.length : 0,
          c.license || ''
        ])
        dataStr = [header, ...rows].map(r => r.join(',')).join('\n')
        const blob = new Blob([dataStr], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'components.csv'
        a.click()
        URL.revokeObjectURL(url)
      } else if (format === 'json') {
        dataStr = JSON.stringify(filteredComponents, null, 2)
        const blob = new Blob([dataStr], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'components.json'
        a.click()
        URL.revokeObjectURL(url)
      }
    } catch (err) {
      toast.error('Failed to export data')
    } finally {
      setExporting(false)
    }
  }

  const getRiskColor = (risk: string) => {
    switch ((risk || '').toLowerCase()) {
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

  if (error) {
    return (
      <main className="min-h-screen flex flex-col">
        <Navbar />
        <div className="container mx-auto py-6 flex items-center justify-center h-[80vh]">
          <div className="text-center">
            <p className="text-lg text-red-600">{error}</p>
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
          <div className="flex gap-2">
            <Button onClick={() => exportData('csv')} disabled={exporting} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export CSV
            </Button>
            <Button onClick={() => exportData('json')} disabled={exporting} variant="outline">
              <Download className="mr-2 h-4 w-4" /> Export JSON
          </Button>
          </div>
        </div>

        {/* Summary Section */}
        {summary && (
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <CardTitle>Component Summary</CardTitle>
              <CardDescription>Overview of components in your software supply chain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Total Components</p>
                  <p className="text-2xl font-bold">{summary.totalComponents}</p>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <p className="text-sm text-red-500">Vulnerable</p>
                  <p className="text-2xl font-bold text-red-600">{summary.vulnerableComponents}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Critical/High</p>
                  <p className="text-2xl font-bold">{(summary.bySeverity.critical || 0) + (summary.bySeverity.high || 0)}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-sm text-gray-500">Medium/Low</p>
                  <p className="text-2xl font-bold">{(summary.bySeverity.medium || 0) + (summary.bySeverity.low || 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

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

            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Component</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Risk</TableHead>
                    <TableHead>Vulnerabilities</TableHead>
                    <TableHead>License</TableHead>
                    <TableHead>AI Remediation</TableHead>
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
                      <TableCell className="font-mono text-xs">{component.group || component.groupName || '-'}</TableCell>
                      <TableCell>{component.version}</TableCell>
                      <TableCell>
                        <Badge className={getRiskColor(component.riskLevel || '')}>
                          {component.riskLevel ? component.riskLevel.charAt(0).toUpperCase() + component.riskLevel.slice(1) : 'Unknown'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {component.vulnerabilities && component.vulnerabilities.length > 0 ? (
                          <div className="flex items-center">
                            <AlertTriangle className="h-4 w-4 text-red-500 mr-1" />
                            {component.vulnerabilities.length}
                          </div>
                        ) : (
                          <span className="text-green-500">0</span>
                        )}
                      </TableCell>
                      <TableCell>{component.license || '-'}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => fetchAiRemediation(component)}
                          disabled={aiSuggestions[component.id]?.loading}
                        >
                          <Sparkles className="h-4 w-4 mr-1" />
                          {aiSuggestions[component.id]?.loading ? 'Loading...' : 'Suggest'}
                        </Button>
                        {aiSuggestions[component.id]?.suggestion && (
                          <div className="mt-2 text-xs text-gray-700 bg-gray-50 p-2 rounded">
                            <strong>AI Suggestion:</strong> {aiSuggestions[component.id].suggestion}
                          </div>
                        )}
                        {aiSuggestions[component.id]?.error && (
                          <div className="mt-2 text-xs text-red-600">{aiSuggestions[component.id].error}</div>
                        )}
                      </TableCell>
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
