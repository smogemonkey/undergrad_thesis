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
import { useToast } from "@/hooks/use-toast"
import { Download, Database, FileSpreadsheet } from "lucide-react"

export function ExportDataDialog({ open, onOpenChange }) {
  const [project, setProject] = useState("jenkins-v2.387.3")
  const [exportFormat, setExportFormat] = useState("csv")
  const [exportType, setExportType] = useState("components")
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeVulnerabilities, setIncludeVulnerabilities] = useState(true)
  const [includeLicenses, setIncludeLicenses] = useState(true)
  const [includeRelationships, setIncludeRelationships] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const { toast } = useToast()

  const handleExport = () => {
    setIsExporting(true)

    // Simulate export process
    setTimeout(() => {
      setIsExporting(false)
      onOpenChange(false)

      toast({
        title: "Data exported",
        description: `Your ${exportType} data has been exported as ${exportFormat.toUpperCase()}.`,
      })
    }, 2000)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Database className="mr-2 h-5 w-5" />
            Export Data
          </DialogTitle>
          <DialogDescription>
            Export SBOM data in various formats for external analysis or integration.
          </DialogDescription>
        </DialogHeader>

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
            <Label htmlFor="format" className="text-right">
              Format
            </Label>
            <div className="col-span-3">
              <Select value={exportFormat} onValueChange={setExportFormat}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      CSV
                    </div>
                  </SelectItem>
                  <SelectItem value="json">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      JSON
                    </div>
                  </SelectItem>
                  <SelectItem value="xml">
                    <div className="flex items-center">
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      XML
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="type" className="text-right">
              Data Type
            </Label>
            <div className="col-span-3">
              <Select value={exportType} onValueChange={setExportType}>
                <SelectTrigger id="type">
                  <SelectValue placeholder="Select data type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="components">Components Only</SelectItem>
                  <SelectItem value="vulnerabilities">Vulnerabilities Only</SelectItem>
                  <SelectItem value="full">Full SBOM</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-start gap-4">
            <Label className="text-right pt-2">Include</Label>
            <div className="col-span-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox id="metadata" checked={includeMetadata} onCheckedChange={setIncludeMetadata} />
                <Label htmlFor="metadata" className="text-gray-700">
                  Project Metadata
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="vulnerabilities"
                  checked={includeVulnerabilities}
                  onCheckedChange={setIncludeVulnerabilities}
                />
                <Label htmlFor="vulnerabilities" className="text-gray-700">
                  Vulnerabilities
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="licenses" checked={includeLicenses} onCheckedChange={setIncludeLicenses} />
                <Label htmlFor="licenses" className="text-gray-700">
                  License Information
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="relationships" checked={includeRelationships} onCheckedChange={setIncludeRelationships} />
                <Label htmlFor="relationships" className="text-gray-700">
                  Component Relationships
                </Label>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? (
              <>Exporting...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
