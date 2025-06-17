"use client"

import { useState, useEffect, useRef } from "react"
import { ChevronDown, ChevronUp, ExternalLink, Shield, Package, GitBranch, Calendar, Tag, BrainCircuit, Wrench, Info, AlertTriangle, Fingerprint, Star, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { type GraphNode } from "@/components/highly-interactive-graph"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { AiServiceModal } from "./ai-service-modal"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/hooks/use-toast"

const API_BASE_URL = "http://localhost:8080";

interface VulnerabilityInfo {
    id: string;
    title?: string;
    severity: string;
    cvss: string;
    cvssScore?: number;
    packageName?: string;
    version?: string;
    description?: string;
    remediation?: string;
}

interface EnhancedNodeDetailProps {
    selectedNode: GraphNode | null;
    onFocusNode?: (nodeId: string) => void;
    onHighlightPath?: (nodeId: string) => void;
    onShowDependents?: (nodeId: string) => void;
    onShowDependencies?: (nodeId: string) => void;
    onAskAi?: (vulnerability: VulnerabilityInfo) => Promise<void>;
    aiSuggestion?: string | null;
    isLoadingAiSuggestion?: boolean;
}

export function EnhancedNodeDetail({
  selectedNode,
  onFocusNode,
  onHighlightPath,
  onShowDependents,
  onShowDependencies,
  onAskAi,
  aiSuggestion,
  isLoadingAiSuggestion,
}: EnhancedNodeDetailProps) {
  const [isOpen, setIsOpen] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [modalState, setModalState] = useState({ isOpen: false, title: "", content: "", isLoading: false })
  const { getAuthHeaders } = useAuth()
  const { toast } = useToast()

  const handleAiService = async (service: "recommendation" | "remediation", vulnerabilityId: string) => {
    setModalState({
      isOpen: true,
      title: service === "recommendation" ? "AI Recommendation" : "AI Remediation",
      content: "",
      isLoading: true,
    })

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/ai/${service}`, {
        method: "POST",
        headers: { ...getAuthHeaders(), "Content-Type": "application/json" },
        body: JSON.stringify({ vulnerabilityId }),
      })

      if (!res.ok) throw new Error(`Failed to get AI ${service}`)
      const data = await res.json()
      
      setModalState(prev => ({ ...prev, content: data.content, isLoading: false }))

    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" })
      setModalState({ isOpen: false, title: "", content: "", isLoading: false })
    }
  }

  if (!selectedNode) {
    return (
      <Card className="bg-card text-card-foreground border rounded-lg shadow-sm">
        <button
          className="flex items-center justify-between w-full p-3 font-medium text-left hover:bg-muted/50 rounded-t-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            Component Details
          </div>
        </button>
        {isOpen && (
          <CardContent className="p-3">
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Shield className="h-10 w-10 opacity-50 mb-2" />
              <p className="text-sm">Select a node from the graph to view its details.</p>
            </div>
          </CardContent>
        )}
      </Card>
    )
  }

  const getRiskColor = (risk: string): string => {
    switch ((risk || '').toLowerCase()) {
      case "critical":
        return "#dc2626"
      case "high":
        return "#ef4444"
      case "medium":
        return "#f97316"
      case "low":
        return "#eab308"
      default:
        return "#3b82f6"
    }
  }

  return (
    <>
      <Card className="bg-card text-card-foreground border rounded-lg shadow-sm">
        <button
          className="flex items-center justify-between w-full p-3 font-medium text-left hover:bg-muted/50 rounded-t-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center">
            <Shield className="mr-2 h-4 w-4" />
            Component Details
          </div>
        </button>
        {isOpen && (
          <CardContent className="p-3">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full mb-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="vulnerabilities">Vulnerabilities</TabsTrigger>
                <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium">{selectedNode.name}</h3>
                  <p className="text-sm text-gray-500">v{selectedNode.version || "1.0.0"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Risk Level</p>
                  <Badge
                    className="mt-1"
                    style={{ backgroundColor: getRiskColor(selectedNode.riskLevel) }}
                  >
                    {selectedNode.riskLevel}
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value="vulnerabilities" className="space-y-4">
                {selectedNode.vulnerabilityInfos && selectedNode.vulnerabilityInfos.length > 0 ? (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Vulnerabilities</h4>
                    <div className="space-y-2">
                      {selectedNode.vulnerabilityInfos.map((vuln: VulnerabilityInfo) => (
                        <div key={vuln.id} className="border rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm font-medium underline cursor-help">{vuln.id}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="max-w-xs">
                                  <div className="font-semibold mb-1">{vuln.id}</div>
                                  <div className="mb-1"><span className="font-medium">Severity:</span> {vuln.severity}</div>
                                  {vuln.cvss && <div className="mb-1"><span className="font-medium">CVSS:</span> {vuln.cvss}</div>}
                                  {vuln.description && <div className="text-xs text-gray-600">{vuln.description}</div>}
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            <Badge
                              className={
                                vuln.severity === "critical"
                                  ? "bg-red-600"
                                  : vuln.severity === "high"
                                    ? "bg-red-500"
                                    : "bg-orange-500"
                              }
                            >
                              {vuln.cvss}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">{vuln.description}</p>
                          <div className="flex flex-col gap-2">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => onAskAi?.(vuln)}
                              disabled={isLoadingAiSuggestion}
                              className="w-full flex items-center justify-center gap-2"
                            >
                              <BrainCircuit className="h-4 w-4" />
                              {isLoadingAiSuggestion ? "Getting AI Suggestion..." : "Get AI Remediation Suggestion"}
                            </Button>
                            {aiSuggestion && (
                              <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                  <Info className="h-4 w-4 text-blue-500" />
                                  <span className="text-sm font-medium text-blue-700 dark:text-blue-300">AI Suggestion</span>
                                </div>
                                <p className="text-sm text-blue-600 dark:text-blue-200">{aiSuggestion}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <Shield className="mx-auto h-8 w-8 text-green-500" />
                    <p className="mt-2 text-sm text-gray-500">No vulnerabilities found</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="dependencies" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium mb-2">Dependencies</h4>
                    <div className="space-y-2">
                      {Array.isArray(selectedNode.dependencies) && selectedNode.dependencies.length > 0 ? (
                        selectedNode.dependencies.map((dep: { id: string; name: string; version: string; risk: string }) => (
                          <div key={dep.id} className="flex items-center justify-between p-2 border rounded">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm underline cursor-help">{dep.name}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="max-w-xs">
                                  <div className="font-semibold mb-1">{dep.name}</div>
                                  {dep.version && <div className="mb-1"><span className="font-medium">Version:</span> {dep.version}</div>}
                                  <div className="mb-1"><span className="font-medium">Risk:</span> {dep.risk}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            <Badge
                              className="ml-2"
                              style={{ backgroundColor: getRiskColor(dep.risk) }}
                            >
                              {dep.risk}
                            </Badge>
                          </div>
                        ))
                      ) : typeof selectedNode.dependencies === 'number' && selectedNode.dependencies > 0 ? (
                        <p className="text-sm text-gray-500">{selectedNode.dependencies} dependencies</p>
                      ) : (
                        <p className="text-sm text-gray-500">No dependencies found</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2">Dependents</h4>
                    <div className="space-y-2">
                      {Array.isArray(selectedNode.dependents) && selectedNode.dependents.length > 0 ? (
                        selectedNode.dependents.map((dep: { id: string; name: string; version: string; risk: string }) => (
                          <div key={dep.id} className="flex items-center justify-between p-2 border rounded">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="text-sm underline cursor-help">{dep.name}</span>
                              </TooltipTrigger>
                              <TooltipContent side="top">
                                <div className="max-w-xs">
                                  <div className="font-semibold mb-1">{dep.name}</div>
                                  {dep.version && <div className="mb-1"><span className="font-medium">Version:</span> {dep.version}</div>}
                                  <div className="mb-1"><span className="font-medium">Risk:</span> {dep.risk}</div>
                                </div>
                              </TooltipContent>
                            </Tooltip>
                            <Badge
                              className="ml-2"
                              style={{ backgroundColor: getRiskColor(dep.risk) }}
                            >
                              {dep.risk}
                            </Badge>
                          </div>
                        ))
                      ) : typeof selectedNode.dependents === 'number' && selectedNode.dependents > 0 ? (
                        <p className="text-sm text-gray-500">{selectedNode.dependents} dependents</p>
                      ) : (
                        <p className="text-sm text-gray-500">No dependents found</p>
                      )}
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
      <AiServiceModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        content={modalState.content}
        isLoading={modalState.isLoading}
      />
    </>
  )
}
