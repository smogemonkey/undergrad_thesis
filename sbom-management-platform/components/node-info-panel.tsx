"use client"

import { X, Shield, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function NodeInfoPanel({ node, onClose, onFocus, onHighlightPath, onShowDependencies, onShowDependents }) {
  if (!node) return null

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

  const getRiskTextColor = (risk) => {
    switch (risk) {
      case "critical":
        return "text-red-600"
      case "high":
        return "text-red-500"
      case "medium":
        return "text-orange-500"
      case "low":
        return "text-yellow-500"
      default:
        return "text-blue-500"
    }
  }

  // Mock vulnerability data based on risk level
  const getVulnerabilityCount = (risk) => {
    switch (risk) {
      case "critical":
        return 2
      case "high":
        return 1
      case "medium":
        return 1
      case "low":
        return 0
      default:
        return 0
    }
  }

  const vulnerabilityCount = node.vulnerabilities?.length || getVulnerabilityCount(node.risk)
  const dependenciesCount = node.dependencies?.length || 6
  const dependentsCount = node.dependents?.length || 1

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center">
          <Package className="mr-2 h-4 w-4" />
          <span className="font-medium">Component Details</span>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-lg">{node.name}</h3>
          <Badge className={getRiskColor(node.risk)}>{node.risk.charAt(0).toUpperCase() + node.risk.slice(1)}</Badge>
        </div>

        <div className="flex items-center gap-1 mb-4">
          <span className="text-sm text-gray-500">v</span>
          <span className="text-sm">{node.version || "1.0.0"}</span>
        </div>

        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={onFocus}>
            Focus
          </Button>
          <Button variant="outline" size="sm" onClick={onHighlightPath}>
            Highlight Path
          </Button>
          <Button variant="outline" size="sm" onClick={onShowDependencies}>
            Dependencies
          </Button>
          <Button variant="outline" size="sm" onClick={onShowDependents}>
            Dependents
          </Button>
        </div>

        <Tabs defaultValue="vulnerabilities">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
            <TabsTrigger value="info">Info</TabsTrigger>
          </TabsList>

          <TabsContent value="vulnerabilities" className="pt-4">
            {vulnerabilityCount > 0 ? (
              <div className="space-y-2">
                {/* Vulnerability list would go here */}
                <div className="p-3 border rounded-md">
                  <div className="flex justify-between">
                    <span className="font-medium">CVE-2021-44228</span>
                    <Badge className="bg-red-600">10.0</Badge>
                  </div>
                  <p className="text-sm mt-1">Remote code execution vulnerability</p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8">
                <Shield className="h-12 w-12 text-green-500 mb-2" />
                <p className="text-sm text-gray-500">No vulnerabilities found</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="dependencies" className="pt-4">
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Direct dependencies: {dependenciesCount}</p>
              {/* Dependencies list would go here */}
            </div>
          </TabsContent>

          <TabsContent value="info" className="pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">License:</span>
                <span className="text-sm">{node.license || "Apache-2.0"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Group:</span>
                <span className="text-sm">{node.group || "com.fasterxml.jackson.core"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Latest version:</span>
                <span className="text-sm">{node.latestVersion || "2.13.0"}</span>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
