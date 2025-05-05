"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function SampleSbomLink() {
  const { toast } = useToast()

  const handleDownloadSample = () => {
    // Create a sample CycloneDX JSON
    const sampleCycloneDX = {
      bomFormat: "CycloneDX",
      specVersion: "1.4",
      serialNumber: "urn:uuid:3e671687-395b-41f5-a30f-a58921a69b79",
      version: 1,
      metadata: {
        timestamp: new Date().toISOString(),
        tools: [
          {
            vendor: "Example",
            name: "SBOM Generator",
            version: "1.0.0",
          },
        ],
        component: {
          type: "application",
          name: "Sample Application",
          version: "1.0.0",
        },
      },
      components: [
        {
          type: "library",
          name: "log4j-core",
          version: "2.14.1",
          purl: "pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1",
          group: "org.apache.logging.log4j",
          description: "Apache Log4j Core implementation",
          licenses: [
            {
              license: {
                id: "Apache-2.0",
              },
            },
          ],
        },
        {
          type: "library",
          name: "commons-text",
          version: "1.9.0",
          purl: "pkg:maven/org.apache.commons/commons-text@1.9.0",
          group: "org.apache.commons",
          description: "Apache Commons Text is a library focused on algorithms working on strings",
          licenses: [
            {
              license: {
                id: "Apache-2.0",
              },
            },
          ],
        },
        {
          type: "library",
          name: "spring-core",
          version: "5.3.20",
          purl: "pkg:maven/org.springframework/spring-core@5.3.20",
          group: "org.springframework",
          description: "Spring Framework Core",
          licenses: [
            {
              license: {
                id: "Apache-2.0",
              },
            },
          ],
        },
      ],
      dependencies: [
        {
          ref: "pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1",
          dependsOn: [],
        },
        {
          ref: "pkg:maven/org.apache.commons/commons-text@1.9.0",
          dependsOn: [],
        },
        {
          ref: "pkg:maven/org.springframework/spring-core@5.3.20",
          dependsOn: ["pkg:maven/org.apache.logging.log4j/log4j-core@2.14.1"],
        },
      ],
    }

    // Convert to JSON string
    const jsonString = JSON.stringify(sampleCycloneDX, null, 2)

    // Create a blob and download link
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "sample-cyclonedx.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({
      title: "Sample SBOM downloaded",
      description: "You can use this file as an example for uploading.",
    })
  }

  return (
    <Button variant="outline" size="sm" onClick={handleDownloadSample}>
      <Download className="mr-2 h-4 w-4" />
      Download Sample CycloneDX
    </Button>
  )
}
