"use client"

import { useState } from "react"
import { Badge } from "@/components/ui/badge"

interface Vulnerability {
  id: string;
  severity: string;
  cvss: string;
  description: string;
}

interface NodeData {
  name: string;
  version: string;
  license: string;
  vulnerabilityInfos: Vulnerability[];
  dependencies: number;
  dependents: number;
}

export function NodeDetail() {
  const [isOpen, setIsOpen] = useState(true)
  const [nodeData, setNodeData] = useState<NodeData | null>(null)

  return (
    <div className="rounded-lg border bg-card text-card-foreground">
      <button
        className="flex w-full items-center justify-between p-4 font-medium"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span>Node Details</span>
        <span>{isOpen ? "▼" : "▶"}</span>
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
                  {nodeData.vulnerabilityInfos && nodeData.vulnerabilityInfos.map((vuln: Vulnerability) => (
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
