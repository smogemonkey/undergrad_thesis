"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Package, ChevronRight, Shield, Activity, Zap } from "lucide-react"
import Link from "next/link"

export function ComponentSummary() {
  const [components] = useState({
    total: 109,
    vulnerable: 11,
    critical: 2,
    high: 4,
    medium: 3,
    low: 2,
    recentlyAdded: [
      { id: "log4j-core", name: "log4j-core", version: "2.14.1", risk: "critical" },
      { id: "commons-text", name: "commons-text", version: "1.9.0", risk: "medium" },
      { id: "jackson-databind", name: "jackson-databind", version: "2.13.4", risk: "high" },
    ],
    mostVulnerable: [
      { id: "log4j-core", name: "log4j-core", version: "2.14.1", vulnerabilities: 2, risk: "critical" },
      { id: "jackson-databind", name: "jackson-databind", version: "2.13.4", vulnerabilities: 2, risk: "high" },
      { id: "commons-text", name: "commons-text", version: "1.9.0", vulnerabilities: 1, risk: "medium" },
    ],
  })

  const getRiskColor = (risk) => {
    switch (risk) {
      case "critical":
        return "badge-status-critical"
      case "high":
        return "badge-status-high"
      case "medium":
        return "badge-status-medium"
      case "low":
        return "badge-status-low"
      default:
        return "badge-status-safe"
    }
  }

  const getRiskIcon = (risk) => {
    switch (risk) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-white" />
      case "high":
        return <AlertTriangle className="h-4 w-4 text-white" />
      case "medium":
        return <Activity className="h-4 w-4 text-white" />
      case "low":
        return <Zap className="h-4 w-4 text-white" />
      default:
        return <Shield className="h-4 w-4 text-white" />
    }
  }

  return (
    <Card className="border-none shadow-lg overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-vibrant-purple/10 to-vibrant-blue/5 rounded-bl-full -z-10"></div>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <div className="bg-gradient-to-r from-vibrant-purple to-vibrant-blue p-2 rounded-lg">
            <Package className="h-5 w-5 text-white" />
          </div>
          <span>Component Summary</span>
        </CardTitle>
        <CardDescription>Overview of components in your software supply chain</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-vibrant-blue/10 to-vibrant-cyan/5 p-3 rounded-lg border border-vibrant-blue/20">
            <p className="text-sm text-vibrant-blue">Total Components</p>
            <p className="text-2xl font-bold text-gray-800">{components.total}</p>
          </div>
          <div className="bg-gradient-to-br from-vibrant-red/10 to-vibrant-orange/5 p-3 rounded-lg border border-vibrant-red/20">
            <p className="text-sm text-vibrant-red">Vulnerable</p>
            <p className="text-2xl font-bold text-vibrant-red">{components.vulnerable}</p>
          </div>
          <div className="bg-gradient-to-br from-vibrant-orange/10 to-vibrant-amber/5 p-3 rounded-lg border border-vibrant-orange/20">
            <p className="text-sm text-vibrant-orange">Critical/High</p>
            <p className="text-2xl font-bold text-gray-800">{components.critical + components.high}</p>
          </div>
          <div className="bg-gradient-to-br from-vibrant-amber/10 to-vibrant-yellow/5 p-3 rounded-lg border border-vibrant-amber/20">
            <p className="text-sm text-vibrant-amber">Medium/Low</p>
            <p className="text-2xl font-bold text-gray-800">{components.medium + components.low}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <div className="h-1 w-4 bg-gradient-to-r from-vibrant-purple to-vibrant-blue rounded-full"></div>
              Recently Added Components
            </h3>
            <div className="space-y-2">
              {components.recentlyAdded.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:border-vibrant-purple/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center">
                    <Badge className={`mr-2 ${getRiskColor(component.risk)} shadow-sm`}>
                      {getRiskIcon(component.risk)}
                    </Badge>
                    <div>
                      <Link href={`/components/${component.id}`} className="text-sm font-medium hover:underline">
                        {component.name}
                      </Link>
                      <p className="text-xs text-gray-500">v{component.version}</p>
                    </div>
                  </div>
                  <Link href={`/components/${component.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-vibrant-purple/10 hover:text-vibrant-purple transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <div className="h-1 w-4 bg-gradient-to-r from-vibrant-red to-vibrant-orange rounded-full"></div>
              Most Vulnerable Components
            </h3>
            <div className="space-y-2">
              {components.mostVulnerable.map((component) => (
                <div
                  key={component.id}
                  className="flex items-center justify-between p-2 border rounded-md hover:border-vibrant-red/30 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center">
                    <Badge className={`mr-2 ${getRiskColor(component.risk)} shadow-sm`}>
                      {getRiskIcon(component.risk)}
                    </Badge>
                    <div>
                      <Link href={`/components/${component.id}`} className="text-sm font-medium hover:underline">
                        {component.name}
                      </Link>
                      <div className="flex items-center text-xs text-vibrant-red">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {component.vulnerabilities} vulnerabilities
                      </div>
                    </div>
                  </div>
                  <Link href={`/components/${component.id}`}>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="hover:bg-vibrant-red/10 hover:text-vibrant-red transition-colors"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Link href="/components">
            <Button
              variant="outline"
              size="sm"
              className="text-xs border-vibrant-purple/30 text-vibrant-purple hover:bg-vibrant-purple/10"
            >
              View All Components
              <ChevronRight className="ml-1 h-3 w-3" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}
