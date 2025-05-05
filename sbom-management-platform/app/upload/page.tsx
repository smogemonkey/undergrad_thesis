"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Upload, FileJson, FileText, CheckCircle, AlertTriangle, Download } from "lucide-react"
import { UploadSbomDialog } from "@/components/upload-sbom-dialog"

export default function UploadPage() {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="bg-white rounded-lg shadow-sm border border-[#e1e8f0] overflow-hidden">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-[#e1e8f0] p-2 rounded-md">
              <Upload className="h-5 w-5 text-[#5a6b7b]" />
            </div>
            <h1 className="text-2xl font-semibold text-[#2d3748]">Upload SBOM Files</h1>
          </div>
          <p className="text-[#64748b] mb-6">
            Upload Software Bill of Materials (SBOM) files to analyze your dependencies
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-lg font-medium text-[#2d3748]">Supported Formats</h2>

              <div className="bg-[#e6f0f5] rounded-md p-4 flex items-start gap-3">
                <FileJson className="h-5 w-5 text-[#5a6b7b] mt-0.5" />
                <div>
                  <p className="font-medium text-[#2d3748]">CycloneDX JSON</p>
                </div>
              </div>

              <div className="bg-[#e6f0f5] rounded-md p-4 flex items-start gap-3">
                <FileText className="h-5 w-5 text-[#5a6b7b] mt-0.5" />
                <div>
                  <p className="font-medium text-[#2d3748]">CycloneDX XML</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-lg font-medium text-[#2d3748]">File Requirements</h2>

              <div className="bg-[#e6f0f5] rounded-md p-4 flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2d3748]">Valid CycloneDX format (v1.2+)</p>
                </div>
              </div>

              <div className="bg-[#e6f0f5] rounded-md p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <p className="font-medium text-[#2d3748]">Must include component information</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <Button
              variant="outline"
              className="flex items-center gap-2 bg-white border-[#5a6b7b] text-[#5a6b7b] hover:bg-[#e1e8f0]"
            >
              <Download className="h-4 w-4" />
              Download Sample CycloneDX
            </Button>
          </div>

          <p className="text-center text-[#64748b] text-sm mt-8">
            Click the "Upload" button in the navigation bar to upload your SBOM files. The system will automatically
            parse and analyze the dependencies and vulnerabilities.
          </p>
        </div>
      </div>

      <UploadSbomDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </div>
  )
}
