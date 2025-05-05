import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { SampleSbomLink } from "@/components/sample-sbom-link"
import { Upload, FileJson, AlertTriangle, CheckCircle2 } from "lucide-react"

export function UploadHelpSection() {
  return (
    <Card className="border shadow-sm overflow-hidden w-full">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="flex items-center gap-2">
          <div className="bg-gray-200 p-2 rounded-lg">
            <Upload className="h-5 w-5 text-gray-700" />
          </div>
          <span>Upload SBOM Files</span>
        </CardTitle>
        <CardDescription>Upload Software Bill of Materials (SBOM) files to analyze your dependencies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-3">Supported Formats</h3>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="bg-gray-100 p-1.5 rounded-full">
                <FileJson className="h-4 w-4 text-gray-700" />
              </div>
              <span className="text-sm">CycloneDX JSON</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="bg-gray-100 p-1.5 rounded-full">
                <FileJson className="h-4 w-4 text-gray-700" />
              </div>
              <span className="text-sm">CycloneDX XML</span>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-sm font-medium mb-3">File Requirements</h3>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="bg-gray-100 p-1.5 rounded-full">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
              </div>
              <span className="text-sm">Valid CycloneDX format (v1.2+)</span>
            </div>
            <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
              <div className="bg-gray-100 p-1.5 rounded-full">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
              </div>
              <span className="text-sm">Must include component information</span>
            </div>
          </div>
        </div>

        <div className="pt-2 flex justify-center">
          <SampleSbomLink />
        </div>

        <div className="text-xs text-gray-500">
          <p>
            Click the "Upload" button in the navigation bar to upload your SBOM files. The system will automatically
            parse and analyze the dependencies and vulnerabilities.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
