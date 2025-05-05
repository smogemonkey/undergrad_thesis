"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { Upload, AlertCircle, CheckCircle2 } from "lucide-react"
import { parseCycloneDX } from "@/lib/sbom-parser"

export function UploadSbomDialog({ open, onOpenChange }) {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStatus, setUploadStatus] = useState<"idle" | "validating" | "uploading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")
  const [parseResult, setParseResult] = useState<any>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    setFile(selectedFile)
    setUploadStatus("idle")
    setErrorMessage("")
    setParseResult(null)
  }

  const validateFile = async (file: File): Promise<boolean> => {
    // Check file extension
    const validExtensions = [".json", ".xml"]
    const fileExtension = file.name.substring(file.name.lastIndexOf(".")).toLowerCase()
    if (!validExtensions.includes(fileExtension)) {
      setErrorMessage("Invalid file format. Please upload a CycloneDX file in JSON or XML format.")
      return false
    }

    // Basic content validation
    try {
      setUploadStatus("validating")
      const content = await file.text()

      // Check if it's a CycloneDX file
      if (fileExtension === ".json") {
        const json = JSON.parse(content)
        if (!json.bomFormat || json.bomFormat !== "CycloneDX") {
          setErrorMessage("The file is not a valid CycloneDX JSON file.")
          return false
        }
      } else if (fileExtension === ".xml") {
        if (!content.includes("http://cyclonedx.org/schema/bom")) {
          setErrorMessage("The file is not a valid CycloneDX XML file.")
          return false
        }
      }

      return true
    } catch (error) {
      setErrorMessage(`Error validating file: ${error.message}`)
      return false
    }
  }

  const handleUpload = async () => {
    if (!file) return

    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Validate the file
      const isValid = await validateFile(file)
      if (!isValid) {
        setUploadStatus("error")
        setIsUploading(false)
        return
      }

      // Simulate upload progress
      setUploadStatus("uploading")
      const interval = setInterval(() => {
        setUploadProgress((prev) => {
          const newProgress = prev + 10
          if (newProgress >= 100) {
            clearInterval(interval)
            return 100
          }
          return newProgress
        })
      }, 200)

      // Parse the file
      const content = await file.text()
      const parseResult = await parseCycloneDX(content, file.name.endsWith(".xml"))
      setParseResult(parseResult)

      // Complete the upload
      setTimeout(() => {
        clearInterval(interval)
        setUploadProgress(100)
        setUploadStatus("success")
        setIsUploading(false)

        toast({
          title: "SBOM uploaded successfully",
          description: `${parseResult.components.length} components found in the SBOM.`,
        })
      }, 1000)
    } catch (error) {
      setErrorMessage(`Error uploading file: ${error.message}`)
      setUploadStatus("error")
      setIsUploading(false)
    }
  }

  const resetUpload = () => {
    setFile(null)
    setUploadStatus("idle")
    setUploadProgress(0)
    setErrorMessage("")
    setParseResult(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleClose = () => {
    if (!isUploading) {
      resetUpload()
      onOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px] bg-[#f0f4f8] border-0">
        <div className="flex items-center gap-2 mb-2">
          <Upload className="h-5 w-5 text-[#5a6b7b]" />
          <h2 className="text-lg font-semibold text-[#2d3748]">Upload CycloneDX SBOM</h2>
          <button
            className="ml-auto text-gray-500 hover:text-gray-700"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <p className="text-[#64748b] text-sm mb-6">
          Upload a Software Bill of Materials (SBOM) in CycloneDX format to analyze dependencies and vulnerabilities.
        </p>

        {uploadStatus !== "success" ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="sbom-file" className="text-sm font-medium text-[#5a6b7b]">
                Select CycloneDX File
              </label>
              <div className="border border-[#c9d6e2] rounded-md overflow-hidden">
                <div className="flex items-center">
                  <label
                    htmlFor="sbom-file"
                    className="bg-white px-4 py-2 border-r border-[#c9d6e2] text-sm font-medium text-[#5a6b7b] hover:bg-[#e1e8f0] cursor-pointer"
                  >
                    Choose File
                  </label>
                  <span className="px-4 py-2 text-sm text-[#64748b]">{file ? file.name : "No file chosen"}</span>
                </div>
                <input
                  id="sbom-file"
                  type="file"
                  ref={fileInputRef}
                  accept=".json,.xml"
                  onChange={handleFileChange}
                  disabled={isUploading}
                  className="sr-only"
                />
              </div>
              <p className="text-xs text-[#64748b]">Supported formats: CycloneDX JSON and XML</p>
            </div>

            {uploadStatus === "uploading" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Uploading...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <Progress value={uploadProgress} className="h-2" />
              </div>
            )}

            {uploadStatus === "error" && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{errorMessage}</AlertDescription>
              </Alert>
            )}

            <div className="flex justify-end gap-2 mt-6">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={isUploading}
                className="bg-white text-[#5a6b7b] border-[#c9d6e2] hover:bg-[#e1e8f0]"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!file || isUploading}
                className="bg-[#7b8a99] text-white hover:bg-[#5a6b7b]"
              >
                {isUploading ? "Uploading..." : "Upload SBOM"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-700">Upload Successful</AlertTitle>
              <AlertDescription className="text-green-600">
                The SBOM has been successfully uploaded and processed.
              </AlertDescription>
            </Alert>

            <div className="rounded-md border border-[#c9d6e2] p-4 bg-white">
              <h3 className="font-medium mb-2 text-[#2d3748]">SBOM Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#64748b]">Components</p>
                  <p className="font-medium text-[#2d3748]">{parseResult?.components?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-[#64748b]">Dependencies</p>
                  <p className="font-medium text-[#2d3748]">{parseResult?.dependencies?.length || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-[#64748b]">Format</p>
                  <p className="font-medium text-[#2d3748]">{parseResult?.format || "Unknown"}</p>
                </div>
                <div>
                  <p className="text-sm text-[#64748b]">Version</p>
                  <p className="font-medium text-[#2d3748]">{parseResult?.version || "Unknown"}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end mt-6">
              <Button onClick={handleClose} className="bg-[#7b8a99] text-white hover:bg-[#5a6b7b]">
                Close
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
