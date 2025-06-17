'use client'

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { aiService, AiRemediationResponse } from "@/services/aiService"

interface AiRemediationModalProps {
  isOpen: boolean
  onClose: () => void
  vulnerabilityId: string
  componentName: string
  componentPurl: string
  componentVersion: string
  buildIdContext?: string
}

export function AiRemediationModal({
  isOpen,
  onClose,
  vulnerabilityId,
  componentName,
  componentPurl,
  componentVersion,
  buildIdContext,
}: AiRemediationModalProps) {
  const [loading, setLoading] = useState(false)
  const [remediationData, setRemediationData] = useState<AiRemediationResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      fetchRemediation()
    }
  }, [isOpen, vulnerabilityId])

  const fetchRemediation = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await aiService.getRemediationSuggestion({
        vulnerabilityDbId: vulnerabilityId,
        affectedComponentPurl: componentPurl,
        affectedComponentVersion: componentVersion,
        buildIdContext,
        projectContextDescription: `Component ${componentName} version ${componentVersion} used in the project`,
      })
      setRemediationData(response)
    } catch (err) {
      setError('Failed to load remediation suggestions')
      toast.error('Failed to load remediation suggestions')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const getConfidenceColor = (confidence: string) => {
    switch (confidence) {
      case 'HIGH':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'LOW':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getEffortColor = (effort: string) => {
    switch (effort) {
      case 'LOW':
        return 'bg-green-100 text-green-800'
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800'
      case 'HIGH':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getRemediationTypeIcon = (type: string) => {
    switch (type) {
      case 'UPGRADE_VERSION':
        return '🔄'
      case 'CONFIGURATION_CHANGE':
        return '⚙️'
      case 'CODE_MODIFICATION':
        return '💻'
      case 'WORKAROUND':
        return '🛠️'
      default:
        return '📝'
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            AI Remediation Suggestions
            <Badge variant="outline" className="ml-2">
              {componentName} v{componentVersion}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Analyzing vulnerability and generating suggestions...</span>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {remediationData && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Vulnerability Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{remediationData.vulnerabilitySummary}</p>
              </CardContent>
            </Card>

            {remediationData.componentContextSummary && (
              <Card>
                <CardHeader>
                  <CardTitle>Component Context</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{remediationData.componentContextSummary}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Suggested Remediations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {remediationData.suggestedRemediations.map((remediation, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{getRemediationTypeIcon(remediation.type)}</span>
                      <h4 className="font-medium">{remediation.type.replace(/_/g, ' ')}</h4>
                      <Badge className={getConfidenceColor(remediation.confidence)}>
                        {remediation.confidence} Confidence
                      </Badge>
                      <Badge className={getEffortColor(remediation.estimatedEffort)}>
                        {remediation.estimatedEffort} Effort
                      </Badge>
                    </div>
                    <p className="text-gray-700 mb-2">{remediation.description}</p>
                    {remediation.codeSnippet && (
                      <div className="mt-2">
                        <p className="text-sm font-medium mb-1">Code Snippet:</p>
                        <pre className="p-2 bg-gray-100 rounded overflow-x-auto text-sm">
                          <code>{remediation.codeSnippet}</code>
                        </pre>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            {remediationData.overallRiskAssessment && (
              <Card>
                <CardHeader>
                  <CardTitle>Overall Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{remediationData.overallRiskAssessment}</p>
                </CardContent>
              </Card>
            )}

            <div className="text-sm text-gray-500 mt-4 p-4 bg-gray-50 rounded-lg">
              {remediationData.disclaimer}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 