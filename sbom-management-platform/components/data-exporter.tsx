"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Download, Check, Database, AlertTriangle, Clock } from "lucide-react"

export function DataExporter({
  project,
  exportFormat,
  exportType,
  includeMetadata,
  includeVulnerabilities,
  includeLicenses,
  includeRelationships,
  onComplete,
  onCancel,
}) {
  const [progress, setProgress] = useState(0)
  const [status, setStatus] = useState("preparing") // preparing, exporting, complete, error
  const [estimatedTime, setEstimatedTime] = useState("15 seconds")
  const { toast } = useToast()

  useEffect(() => {
    // Simulate export process
    if (status === "preparing") {
      const timer = setTimeout(() => {
        setStatus("exporting")
        simulateProgress()
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [status])

  const simulateProgress = () => {
    let currentProgress = 0
    const interval = setInterval(() => {
      currentProgress += Math.random() * 20
      if (currentProgress >= 100) {
        currentProgress = 100
        clearInterval(interval)
        setProgress(100)
        setStatus("complete")
        toast({
          title: "Data exported successfully",
          description: `Your ${exportType} data is ready to download.`,
        })
      } else {
        setProgress(Math.min(currentProgress, 99))
        updateEstimatedTime(currentProgress)
      }
    }, 600)
  }

  const updateEstimatedTime = (currentProgress) => {
    if (currentProgress < 30) {
      setEstimatedTime("15 seconds")
    } else if (currentProgress < 60) {
      setEstimatedTime("10 seconds")
    } else if (currentProgress < 80) {
      setEstimatedTime("5 seconds")
    } else {
      setEstimatedTime("Almost done")
    }
  }

  const handleDownload = () => {
    toast({
      title: "Data downloaded",
      description: `${exportType} data for ${project} has been downloaded as ${exportFormat.toUpperCase()}.`,
    })
    onComplete?.()
  }

  const handleCancel = () => {
    toast({
      title: "Export cancelled",
      description: "The data export process has been cancelled.",
    })
    onCancel?.()
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Database className="mr-2 h-5 w-5" />
          Exporting Data
        </CardTitle>
        <CardDescription>
          {status === "preparing" && "Preparing to export your data..."}
          {status === "exporting" && `Exporting ${exportType} data for ${project}...`}
          {status === "complete" && "Your data is ready to download"}
          {status === "error" && "There was an error exporting your data"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Progress</span>
            <span className="text-sm font-medium">{Math.round(progress)}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {status !== "complete" && (
          <div className="flex items-center text-sm text-gray-500">
            <Clock className="mr-2 h-4 w-4" />
            <span>Estimated time remaining: {estimatedTime}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Export Details</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Project:</span>
                <span className="text-sm font-medium">{project}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Format:</span>
                <span className="text-sm font-medium uppercase">{exportFormat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Type:</span>
                <span className="text-sm font-medium capitalize">{exportType}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-sm font-medium">Included Data</h4>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-sm">Metadata:</span>
                <Badge variant={includeMetadata ? "default" : "outline"}>{includeMetadata ? "Yes" : "No"}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Vulnerabilities:</span>
                <Badge variant={includeVulnerabilities ? "default" : "outline"}>
                  {includeVulnerabilities ? "Yes" : "No"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Licenses:</span>
                <Badge variant={includeLicenses ? "default" : "outline"}>{includeLicenses ? "Yes" : "No"}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Relationships:</span>
                <Badge variant={includeRelationships ? "default" : "outline"}>
                  {includeRelationships ? "Yes" : "No"}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {status === "complete" && (
          <div className="rounded-md bg-green-50 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Check className="h-5 w-5 text-green-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Export complete</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Your data has been successfully exported and is ready to download.</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-md bg-red-50 p-4 mt-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Export failed</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>There was an error exporting your data. Please try again.</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        {status !== "complete" ? (
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={onComplete}>
              Close
            </Button>
            <Button onClick={handleDownload}>
              <Download className="mr-2 h-4 w-4" />
              Download Data
            </Button>
          </>
        )}
      </CardFooter>
    </Card>
  )
}
