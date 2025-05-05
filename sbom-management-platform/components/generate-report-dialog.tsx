"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { FileText, Download, Sparkles } from "lucide-react"

export function GenerateReportDialog({ open, onOpenChange }) {
  const [project, setProject] = useState("jenkins-v2.387.3")
  const [reportType, setReportType] = useState("summary")
  const [format, setFormat] = useState("pdf")
  const [includeVulnerabilities, setIncludeVulnerabilities] = useState(true)
  const [includeLicenses, setIncludeLicenses] = useState(true)
  const [includeGraph, setIncludeGraph] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("standard")
  const { toast } = useToast()

  const handleGenerateReport = () => {
    setIsGenerating(true)

    // Simulate report generation
    setTimeout(() => {
      setIsGenerating(false)
      onOpenChange(false)

      toast({
        title: "Report generated",
        description: `Your ${reportType} report has been generated and downloaded as ${format.toUpperCase()}.`,
      })
    }, 2000)
  }

  const handleGenerateAIReport = () => {
    setIsGenerating(true)

    // Simulate AI report generation
    setTimeout(() => {
      setIsGenerating(false)
      onOpenChange(false)

      toast({
        title: "AI Report generated",
        description: "Your AI-powered security analysis report has been generated.",
      })
    }, 3000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <FileText className="mr-2 h-5 w-5" />
            Generate Report
          </DialogTitle>
          <DialogDescription>
            Create a customized report with dependency and vulnerability information.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="standard">Standard Report</TabsTrigger>
            <TabsTrigger value="ai">AI-Powered Report</TabsTrigger>
          </TabsList>

          <TabsContent value="standard" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="project" className="text-right">
                  Project
                </Label>
                <div className="col-span-3">
                  <Select value={project} onValueChange={setProject}>
                    <SelectTrigger id="project">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jenkins-v2.387.3">Jenkins v2.387.3</SelectItem>
                      <SelectItem value="spring-boot-2.7.0">Spring Boot 2.7.0</SelectItem>
                      <SelectItem value="kubernetes-1.26">Kubernetes 1.26</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Report Type</Label>
                <RadioGroup
                  value={reportType}
                  onValueChange={setReportType}
                  className="col-span-3 flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="summary" id="summary" />
                    <Label htmlFor="summary">Summary Report</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="detailed" id="detailed" />
                    <Label htmlFor="detailed">Detailed Report</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compliance" id="compliance" />
                    <Label htmlFor="compliance">Compliance Report</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Format</Label>
                <RadioGroup value={format} onValueChange={setFormat} className="col-span-3 flex space-x-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf">PDF</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="csv" id="csv" />
                    <Label htmlFor="csv">CSV</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="html" id="html" />
                    <Label htmlFor="html">HTML</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Include</Label>
                <div className="col-span-3 space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="vulnerabilities"
                      checked={includeVulnerabilities}
                      onCheckedChange={setIncludeVulnerabilities}
                    />
                    <Label htmlFor="vulnerabilities">Vulnerabilities</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="licenses" checked={includeLicenses} onCheckedChange={setIncludeLicenses} />
                    <Label htmlFor="licenses">License Information</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="graph" checked={includeGraph} onCheckedChange={setIncludeGraph} />
                    <Label htmlFor="graph">Dependency Graph</Label>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateReport} disabled={isGenerating}>
                {isGenerating ? (
                  <>Generating...</>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Generate Report
                  </>
                )}
              </Button>
            </DialogFooter>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="ai-project" className="text-right">
                  Project
                </Label>
                <div className="col-span-3">
                  <Select value={project} onValueChange={setProject}>
                    <SelectTrigger id="ai-project">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="jenkins-v2.387.3">Jenkins v2.387.3</SelectItem>
                      <SelectItem value="spring-boot-2.7.0">Spring Boot 2.7.0</SelectItem>
                      <SelectItem value="kubernetes-1.26">Kubernetes 1.26</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="col-span-4 space-y-2">
                <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
                  <div className="flex flex-col space-y-1.5">
                    <h3 className="text-lg font-semibold leading-none tracking-tight text-gray-800">
                      AI-Powered Report Generation
                    </h3>
                    <p className="text-sm text-gray-700">
                      Use AI to analyze your components and generate insights beyond standard reports.
                    </p>
                  </div>
                  <div className="mt-4 space-y-4">
                    <div className="flex items-start space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800">Security Analysis</p>
                        <p className="text-xs text-gray-700">
                          In-depth analysis of vulnerabilities, their impact, and recommended mitigations
                        </p>
                      </div>
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800">License Compliance</p>
                        <p className="text-xs text-gray-700">Analysis of license compatibility and compliance risks</p>
                      </div>
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-gray-800">Dependency Insights</p>
                        <p className="text-xs text-gray-700">
                          Intelligent insights about your dependency graph and potential optimizations
                        </p>
                      </div>
                      <Sparkles className="h-5 w-5 text-amber-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button onClick={handleGenerateAIReport} disabled={isGenerating}>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate AI Report
              </Button>
            </DialogFooter>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
