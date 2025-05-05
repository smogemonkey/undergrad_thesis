"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { ChevronDown, ChevronUp } from "lucide-react"

export function NodeDetail() {
  const [isOpen, setIsOpen] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)

  // This would be populated when a node is selected in the graph
  const nodeData = {
    name: "log4j-core",
    version: "2.14.1",
    license: "Apache-2.0",
    vulnerabilities: [
      { id: "CVE-2021-44228", severity: "Critical", cvss: 10.0 },
      { id: "CVE-2021-45046", severity: "High", cvss: 9.0 },
    ],
    dependencies: 5,
    dependents: 12,
  }

  return (
    <div>
      <button
        className="flex items-center justify-between w-full p-4 font-medium text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        Node detail
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-3">
          {nodeData ? (
            <>
              <div>
                <h3 className="font-medium">{nodeData.name}</h3>
                <p className="text-sm text-gray-500">v{nodeData.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium">License</p>
                <Badge variant="outline">{nodeData.license}</Badge>
              </div>
              <div>
                <p className="text-sm font-medium">Vulnerabilities</p>
                <div className="space-y-1 mt-1">
                  {nodeData.vulnerabilities.map((vuln) => (
                    <div key={vuln.id} className="flex items-center justify-between">
                      <span className="text-xs">{vuln.id}</span>
                      <Badge
                        className={
                          vuln.severity === "Critical"
                            ? "bg-red-600"
                            : vuln.severity === "High"
                              ? "bg-orange-500"
                              : "bg-yellow-500"
                        }
                      >
                        {vuln.cvss}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between">
                <div>
                  <p className="text-sm font-medium">Dependencies</p>
                  <p className="text-sm">{nodeData.dependencies}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Dependents</p>
                  <p className="text-sm">{nodeData.dependents}</p>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">Select a node to view details</p>
          )}
        </div>
      )}
    </div>
  )
}
