"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Download, Copy, Check, Sparkles, Share2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import ReactMarkdown from "react-markdown"

export interface LLMGeneratedReportProps {
  report: {
    content: string
    format: string
    model: string
    generatedAt: string
    prompt?: string
  }
  onClose: () => void
  onDownload: () => void
}

export function LLMGeneratedReport({ report, onClose, onDownload }: LLMGeneratedReportProps) {
  const [activeTab, setActiveTab] = useState("preview")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  const handleCopy = () => {
    navigator.clipboard.writeText(report.content)
    setCopied(true)
    toast({
      title: "Copied to clipboard",
      description: "Report content has been copied to your clipboard",
    })
    setTimeout(() => setCopied(false), 2000)
  }

  const handleShare = () => {
    // In a real implementation, this would generate a shareable link
    toast({
      title: "Report shared",
      description: "A shareable link has been copied to your clipboard",
    })
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle className="flex items-center">
            <Sparkles className="mr-2 h-5 w-5" />
            AI-Generated Report
          </CardTitle>
          <Badge variant="outline" className="font-mono">
            {report.model}
          </Badge>
        </div>
        <CardDescription>Generated on {new Date(report.generatedAt).toLocaleString()}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="source">Source</TabsTrigger>
          </TabsList>
          <TabsContent value="preview" className="min-h-[400px] max-h-[600px] overflow-y-auto border rounded-md p-4">
            {report.format === "markdown" ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{report.content}</ReactMarkdown>
              </div>
            ) : report.format === "html" ? (
              <div dangerouslySetInnerHTML={{ __html: report.content }} />
            ) : (
              <pre className="whitespace-pre-wrap">{report.content}</pre>
            )}
          </TabsContent>
          <TabsContent value="source" className="min-h-[400px] max-h-[600px] overflow-y-auto">
            <div className="relative">
              <pre className="bg-muted p-4 rounded-md overflow-x-auto whitespace-pre-wrap text-sm">
                {report.content}
              </pre>
              <Button size="sm" variant="ghost" className="absolute top-2 right-2" onClick={handleCopy}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {report.prompt && (
              <div className="mt-4 p-4 border rounded-md bg-muted/50">
                <h4 className="text-sm font-medium mb-2">Prompt Used:</h4>
                <p className="text-sm text-muted-foreground">{report.prompt}</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={handleShare}>
            <Share2 className="mr-2 h-4 w-4" />
            Share
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onDownload}>
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
