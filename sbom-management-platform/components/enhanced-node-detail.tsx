"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Shield, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export function EnhancedNodeDetail({
  selectedNode,
  onFocusNode,
  onHighlightPath,
  onShowDependents,
  onShowDependencies,
}) {
  const [isOpen, setIsOpen] = useState(true)

  const handleFocusNode = () => {
    if (selectedNode) {
      onFocusNode?.(selectedNode.id)
    }
  }

  const handleHighlightPath = () => {
    if (selectedNode) {
      onHighlightPath?.(selectedNode.id)
    }
  }

  const handleShowDependencies = () => {
    if (selectedNode) {
      onShowDependencies?.(selectedNode.id)
    }
  }

  const handleShowDependents = () => {
    if (selectedNode) {
      onShowDependents?.(selectedNode.id)
    }
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

  return (
    <div className="bg-white border rounded-lg shadow-sm">
      <button
        className="flex items-center justify-between w-full p-4 font-medium text-left text-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <Package className="mr-2 h-4 w-4 text-gray-700" />
          Component Details
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          {selectedNode ? (
            <>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-800">{selectedNode.name}</h3>
                <Badge className={getRiskColor(selectedNode.risk)}>
                  {selectedNode.risk.charAt(0).toUpperCase() + selectedNode.risk.slice(1)}
                </Badge>
              </div>

              <div className="text-sm text-gray-600 mb-3">v{selectedNode.version || "1.0.0"}</div>

              <div className="grid grid-cols-2 gap-2 mb-4">
                <Button variant="outline" size="sm" onClick={handleFocusNode} className="text-gray-700">
                  Focus
                </Button>
                <Button variant="outline" size="sm" onClick={handleHighlightPath} className="text-gray-700">
                  Highlight Path
                </Button>
                <Button variant="outline" size="sm" onClick={handleShowDependencies} className="text-gray-700">
                  Dependencies
                </Button>
                <Button variant="outline" size="sm" onClick={handleShowDependents} className="text-gray-700">
                  Dependents
                </Button>
              </div>

              <Tabs defaultValue="vulnerabilities">
                <TabsList className="w-full mb-4 bg-gray-100">
                  <TabsTrigger value="vulnerabilities" className="text-gray-700">
                    Vulnerabilities
                  </TabsTrigger>
                  <TabsTrigger value="dependencies" className="text-gray-700">
                    Dependencies
                  </TabsTrigger>
                  <TabsTrigger value="info" className="text-gray-700">
                    Info
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="vulnerabilities" className="space-y-4">
                  {selectedNode.vulnerabilities && selectedNode.vulnerabilities.length > 0 ? (
                    <div className="space-y-2">
                      {selectedNode.vulnerabilities.map((vuln, index) => (
                        <div key={index} className="p-2 border rounded-md">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-sm">{vuln.id}</span>
                            <Badge className={vuln.severity === "Critical" ? "bg-red-600" : "bg-red-500"}>
                              {vuln.cvss}
                            </Badge>
                          </div>
                          <p className="text-xs text-gray-600 mt-1">{vuln.description}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-6">
                      <Shield className="h-12 w-12 text-green-500 mb-2" />
                      <p className="text-gray-700">No vulnerabilities found</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="dependencies" className="space-y-2">
                  {selectedNode.dependencies && selectedNode.dependencies.length > 0 ? (
                    selectedNode.dependencies.map((dep, index) => (
                      <div key={index} className="p-2 border rounded-md">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-800">{dep.name}</span>
                          <Badge className={getRiskColor(dep.risk)}>
                            {dep.risk.charAt(0).toUpperCase() + dep.risk.slice(1)}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600">v{dep.version}</p>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-600 py-4">No dependencies found</p>
                  )}
                </TabsContent>

                <TabsContent value="info" className="space-y-2">
                  <div className="p-2 border rounded-md">
                    <p className="text-sm font-medium text-gray-800">License</p>
                    <p className="text-sm text-gray-600">{selectedNode.license || "Apache-2.0"}</p>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="text-sm font-medium text-gray-800">Group</p>
                    <p className="text-sm text-gray-600">{selectedNode.group || "org.example"}</p>
                  </div>
                  <div className="p-2 border rounded-md">
                    <p className="text-sm font-medium text-gray-800">Type</p>
                    <p className="text-sm text-gray-600">{selectedNode.type || "jar"}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-10">
              <Package className="h-10 w-10 text-gray-300 mb-2" />
              <p className="text-gray-600">Select a node to view details</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
