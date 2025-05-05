"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Zap, Brain, Lightbulb, Gauge } from "lucide-react"

export interface LLMReportOptionsProps {
  onGenerate: (options: LLMReportOptions) => void
  onCancel: () => void
  isGenerating?: boolean
}

export interface LLMReportOptions {
  model: string
  prompt: string
  detailLevel: number
  includeRecommendations: boolean
  includeMitigations: boolean
  includeRiskAnalysis: boolean
  tone: string
  format: string
}

export function LLMReportOptions({ onGenerate, onCancel, isGenerating = false }: LLMReportOptionsProps) {
  const [model, setModel] = useState("gpt-4o")
  const [prompt, setPrompt] = useState(
    "Generate a comprehensive security report for the selected components, focusing on vulnerabilities and their potential impact.",
  )
  const [detailLevel, setDetailLevel] = useState(70)
  const [includeRecommendations, setIncludeRecommendations] = useState(true)
  const [includeMitigations, setIncludeMitigations] = useState(true)
  const [includeRiskAnalysis, setIncludeRiskAnalysis] = useState(true)
  const [tone, setTone] = useState("professional")
  const [format, setFormat] = useState("markdown")

  const handleGenerate = () => {
    onGenerate({
      model,
      prompt,
      detailLevel,
      includeRecommendations,
      includeMitigations,
      includeRiskAnalysis,
      tone,
      format,
    })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <Label htmlFor="model">AI Model</Label>
          <Badge variant="outline" className="font-mono">
            <Sparkles className="h-3 w-3 mr-1" />
            {model}
          </Badge>
        </div>
        <Select value={model} onValueChange={setModel}>
          <SelectTrigger id="model">
            <SelectValue placeholder="Select AI model" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="gpt-4o">
              <div className="flex items-center">
                <Brain className="mr-2 h-4 w-4" />
                GPT-4o (Recommended)
              </div>
            </SelectItem>
            <SelectItem value="gpt-3.5-turbo">
              <div className="flex items-center">
                <Zap className="mr-2 h-4 w-4" />
                GPT-3.5 Turbo (Faster)
              </div>
            </SelectItem>
            <SelectItem value="claude-3-opus">
              <div className="flex items-center">
                <Lightbulb className="mr-2 h-4 w-4" />
                Claude 3 Opus
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="prompt">Custom Instructions</Label>
        <Textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Provide specific instructions for the AI to follow when generating the report..."
          className="min-h-[100px]"
        />
        <p className="text-xs text-muted-foreground">
          Customize how the AI should analyze and present information about your components.
        </p>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between">
          <Label htmlFor="detail-level">Detail Level</Label>
          <span className="text-xs text-muted-foreground">
            {detailLevel < 30 ? "Concise" : detailLevel < 70 ? "Balanced" : "Comprehensive"}
          </span>
        </div>
        <Slider
          id="detail-level"
          value={[detailLevel]}
          min={10}
          max={100}
          step={10}
          onValueChange={(value) => setDetailLevel(value[0])}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Report Content</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="flex items-center justify-between">
              <Label htmlFor="recommendations" className="flex items-center">
                <Lightbulb className="h-4 w-4 mr-2 text-amber-500" />
                Recommendations
              </Label>
              <Switch
                id="recommendations"
                checked={includeRecommendations}
                onCheckedChange={setIncludeRecommendations}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="mitigations" className="flex items-center">
                <Shield className="h-4 w-4 mr-2 text-blue-500" />
                Mitigations
              </Label>
              <Switch id="mitigations" checked={includeMitigations} onCheckedChange={setIncludeMitigations} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="risk-analysis" className="flex items-center">
                <Gauge className="h-4 w-4 mr-2 text-red-500" />
                Risk Analysis
              </Label>
              <Switch id="risk-analysis" checked={includeRiskAnalysis} onCheckedChange={setIncludeRiskAnalysis} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Output Format</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-0">
            <div className="space-y-2">
              <Label htmlFor="tone">Tone</Label>
              <Select value={tone} onValueChange={setTone}>
                <SelectTrigger id="tone">
                  <SelectValue placeholder="Select tone" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="simplified">Simplified</SelectItem>
                  <SelectItem value="executive">Executive Summary</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="format">Format</Label>
              <Select value={format} onValueChange={setFormat}>
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="markdown">Markdown</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="plain">Plain Text</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end space-x-2">
        <Button variant="outline" onClick={onCancel} disabled={isGenerating}>
          Cancel
        </Button>
        <Button onClick={handleGenerate} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Generate AI Report
            </>
          )}
        </Button>
      </div>
    </div>
  )
}

// Missing import
import { Shield } from "lucide-react"
