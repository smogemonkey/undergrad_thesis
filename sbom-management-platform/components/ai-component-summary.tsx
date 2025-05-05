"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Sparkles, RefreshCw, AlertTriangle, Shield } from "lucide-react"

interface AIComponentSummaryProps {
  component: any // Replace with proper type
  onRefresh?: () => void
}

export function AIComponentSummary({ component, onRefresh }: AIComponentSummaryProps) {
  const [summary, setSummary] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (component) {
      generateSummary()
    }
  }, [component])

  const generateSummary = async () => {
    setIsLoading(true)

    // In a real implementation, this would call an API endpoint
    // that interfaces with an LLM to generate the summary
    // For now, we'll simulate it with a timeout and predefined summaries

    setTimeout(() => {
      let generatedSummary = ""

      if (component.risk === "critical" || component.risk === "high") {
        generatedSummary = `${component.name} is a ${component.risk} risk component with ${component.vulnerabilities?.length || 0} known vulnerabilities. 
        Immediate attention is recommended as it may pose significant security risks to your application. 
        Consider upgrading to the latest version (${component.latestVersion}) which addresses these vulnerabilities.
        This component is used by ${component.dependents?.length || 0} other components in your system, making its security impact widespread.`
      } else if (component.risk === "medium") {
        generatedSummary = `${component.name} has moderate security concerns with ${component.vulnerabilities?.length || 0} vulnerabilities of medium severity. 
        While not critical, addressing these issues should be planned in your next update cycle.
        The component is currently at version ${component.version}, with version ${component.latestVersion} available that resolves some security issues.`
      } else {
        generatedSummary = `${component.name} appears to be secure with ${component.vulnerabilities?.length || 0} known vulnerabilities. 
        It's licensed under ${component.licenses?.[0]?.name || "an unknown license"} and is currently at version ${component.version}.
        This component is a dependency for ${component.dependents?.length || 0} other components in your system.
        Regular monitoring is still recommended as part of good security practices.`
      }

      setSummary(generatedSummary)
      setIsLoading(false)
    }, 1500)
  }

  const handleRefresh = () => {
    generateSummary()
    onRefresh?.()
  }

  if (!component) {
    return null
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <Sparkles className="mr-2 h-5 w-5" />
            AI Security Analysis
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={handleRefresh} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${isLoading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
        <CardDescription>AI-generated security assessment and recommendations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            <span className="ml-3">Analyzing component...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <p className="text-sm whitespace-pre-line">{summary}</p>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-lg border border-amber-200 bg-amber-50">
              {component.risk === "critical" || component.risk === "high" ? (
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
              ) : (
                <Shield className="h-5 w-5 text-green-500 mt-0.5" />
              )}
              <div>
                <h4 className="text-sm font-medium">Recommendation</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {component.risk === "critical" || component.risk === "high"
                    ? `Upgrade to version ${component.latestVersion} as soon as possible to address critical vulnerabilities.`
                    : component.risk === "medium"
                      ? `Consider upgrading to version ${component.latestVersion} in your next planned update cycle.`
                      : `This component appears to be secure, but continue monitoring for new vulnerabilities.`}
                </p>
              </div>
            </div>

            <div className="flex justify-end">
              <Badge variant="outline" className="text-xs">
                Generated by AI • Not a substitute for professional security audit
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
