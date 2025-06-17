'use client'

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Loader2 } from "lucide-react"
import { toast } from "sonner"
import { AiAlternativeResponse } from "@/services/aiService"

interface AiSuggestionModalProps {
  isOpen: boolean
  onClose: () => void
  suggestionData: AiAlternativeResponse | null
}

export function AiSuggestionModal({
  isOpen,
  onClose,
  suggestionData,
}: AiSuggestionModalProps) {
  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'bg-green-100 text-green-800'
    if (confidence >= 0.5) return 'bg-yellow-100 text-yellow-800'
    return 'bg-red-100 text-red-800'
  }

  const getMigrationEffortColor = (effort: string) => {
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            AI Package Suggestions
            <Badge variant="outline" className="ml-2">
              {suggestionData?.originalComponentName} v{suggestionData?.originalComponentVersion}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        {!suggestionData ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Analyzing component and generating suggestions...</span>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestionData.summary && (
              <Card>
                <CardHeader>
                  <CardTitle>Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700">{suggestionData.summary}</p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Suggested Alternatives</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {suggestionData.alternatives.map((alt, index) => (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{alt.name}</h4>
                        <p className="text-sm text-gray-500">Version: {alt.suggestedVersion}</p>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getConfidenceColor(alt.confidenceScore)}>
                          {Math.round(alt.confidenceScore * 100)}% Confidence
                        </Badge>
                        {alt.licenseSpdxId && (
                          <Badge variant="outline">
                            {alt.licenseSpdxId}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-700 mb-2">{alt.reasoning}</p>
                    {alt.notes && (
                      <div className="mt-2 text-sm text-gray-600">
                        <p className="font-medium">Notes:</p>
                        <p>{alt.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="text-sm text-gray-500 mt-4 p-4 bg-gray-50 rounded-lg">
              {suggestionData.disclaimer}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
} 