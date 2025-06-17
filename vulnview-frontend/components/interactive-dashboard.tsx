"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { EnhancedGraphControls } from "@/components/enhanced-graph-controls"
import { EnhancedNodeDetail } from "@/components/enhanced-node-detail"
import { InteractiveLegend } from "@/components/interactive-legend"
import { TimelineSlider } from "@/components/timeline-slider"
import { HighlyInteractiveGraph, type GraphLink, type GraphData } from "@/components/highly-interactive-graph"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, ExternalLink, ZoomIn, ZoomOut, Maximize, RotateCcw, Crosshair, BrainCircuit, Info, ChevronDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import * as d3 from 'd3'
import { UploadSbomDialog } from "@/components/upload-sbom-dialog"
import { ComponentSummary } from "@/components/component-summary"
import { toast } from "sonner"
import type { RiskVisibility, RiskOpacity } from "@/components/interactive-legend"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const API_BASE_URL = "http://localhost:8080"; // Ensure this is your correct backend URL

interface Vulnerability {
  id: string;
  severity: string;
  cvss: string;
  description: string;
}

export interface GraphNode {
  id: string;
  name: string;
  version?: string;
  riskLevel: RiskLevel;
  type?: string;
  purl?: string;
  size?: number;
  dependencies?: number;
  dependents?: number;
  vulnerabilityInfos?: Vulnerability[];
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  [key: string]: any;
}

// Define the expected structure for nodes and links from the API
interface ApiNode extends Omit<GraphNode, 'vulnerabilityInfos'> {
  vulnerabilityInfos: Vulnerability[];
}

interface ApiLink {
  source: string; // bom-ref of the source node
  target: string; // bom-ref of the target node
  value?: number; // Optional, for link thickness
  [key: string]: any; // Allow other properties
}

interface GraphApiResponse {
  nodes: ApiNode[];
  links: ApiLink[];
  scanStatus?: string;
}

// Add type definitions for settings and handlers
interface VisibilitySettings {
  visibility: {
    critical: boolean;
    high: boolean;
    medium: boolean;
    low: boolean;
    safe: boolean;
    unknown: boolean;
  };
}

interface OpacitySettings {
  [key: string]: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  safe: number;
  unknown: number;
}

interface TimelineData {
  timestamp: number;
  nodes: GraphNode[];
  links: GraphLink[];
}

interface SavedView {
  id: string;
  name: string;
  description?: string;
  timestamp: string;
  settings: {
    filterSettings: FilterSettings;
    layoutSettings: LayoutSettings;
    visibilitySettings: VisibilitySettings;
    opacitySettings: OpacitySettings;
  };
}

// Add interface for EnhancedGraphControls props
interface EnhancedGraphControlsProps {
  nodeSize: number;
  onNodeSizeChange: (value: number) => void;
  linkDistance: number;
  onLinkDistanceChange: (value: number) => void;
  chargeStrength: number;
  onChargeStrengthChange: (value: number) => void;
  showLabels: boolean;
  onShowLabelsChange: (value: boolean) => void;
  highlightVulnerabilities: boolean;
  onHighlightVulnerabilitiesChange: (value: boolean) => void;
  selectedRiskLevels: RiskLevel[];
  onSelectedRiskLevelsChange: (value: RiskLevel[]) => void;
  minNodeConnections: number;
  onMinNodeConnectionsChange: (value: number) => void;
  stickyNodes: boolean;
  onStickyNodesChange: (value: boolean) => void;
  onLayoutChange: (settings: LayoutSettings) => void;
  onHighlightChange: (settings: { highlightVulnerabilities: boolean }) => void;
  onSearchNode: (query: string) => void;
  onSaveView: () => void;
  onShareView: () => void;
  onExportGraph: (format: 'png' | 'svg' | 'json', resolution: number) => void;
  onResetView: () => void;
  onLoadView: (view: SavedView) => void;
  onCreateView: (view: SavedView) => void;
  savedViews: SavedView[];
}

// Add interface for EnhancedNodeDetail props
interface EnhancedNodeDetailProps {
  selectedNode: GraphNode | null;
  onFocusNode: (nodeId: string) => void;
  onHighlightPath: (nodeId: string) => void;
  onShowDependents: (nodeId: string) => void;
  onShowDependencies: (nodeId: string) => void;
}

// Add interface for InteractiveLegend props
interface InteractiveLegendProps {
  onVisibilityChange: (settings: VisibilitySettings) => void;
  onOpacityChange: (settings: OpacitySettings) => void;
}

// Add interface for TimelineSlider props
interface TimelineSliderProps {
  onTimelineChange: (data: TimelineData) => void;
}

// Match the types expected by HighlyInteractiveGraph
type RiskLevel = 'critical' | 'high' | 'medium' | 'low' | 'safe' | 'unknown';
interface FilterSettings {
  nodeSizeFactor: number;
  linkDistanceFactor: number;
  chargeStrengthFactor: number;
  showLabels: boolean;
  highlightVulnerabilities: boolean;
  selectedRiskLevels: RiskLevel[];
  minNodeConnections: number;
  stickyNodes: boolean;
}
interface LayoutSettings {
  type: 'force' | 'radial' | 'hierarchical' | 'circular';
  groupBy: string;
  options?: Record<string, any>;
}

// Local GraphRef type (matches highly-interactive-graph)
type GraphRef = {
  saveView: () => Record<string, any> | null;
  shareView: () => string | null;
  exportGraph: (format: "png" | "svg" | "json", resolutionScale?: number) => void;
  resetView: () => void;
  highlightPath: (startNodeId: string, endNodeId: string) => string[] | null;
  toggleAnimation: (forceState?: boolean) => void;
  loadSavedView: (view: Record<string, any>) => void;
  focusNode: (nodeId: string) => void;
  showDependencies: (nodeId: string) => void;
  showDependents: (nodeId: string) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  centerGraph: () => void;
};

interface Settings {
  filter: FilterSettings;
  layout: LayoutSettings;
  visibility: VisibilitySettings;
  opacity: OpacitySettings;
}

export interface InteractiveDashboardProps {
  graphData: GraphData | null;
  onNodeClick: (node: GraphNode) => void;
  onNodeSelect?: (node: GraphNode) => void;
  params: { projectId: string; repositoryId: string };
  sbomId: string | null;
  filterSettings?: any;
  selectedNode: GraphNode | null;
  onAskAi?: (vulnerability: Vulnerability, analysisType: 'remediation' | 'alternatives' | 'risk') => Promise<void>;
  aiSuggestion?: string | null;
  isLoadingAiSuggestion?: boolean;
}

export function InteractiveDashboard({ 
  graphData: initialGraphData, 
  onNodeClick: parentOnNodeClick, 
  onNodeSelect,
  params, 
  sbomId, 
  filterSettings,
  selectedNode: externalSelectedNode,
  onAskAi,
  aiSuggestion,
  isLoadingAiSuggestion
}: InteractiveDashboardProps) {
  const [graphData, setGraphData] = useState<GraphData | null>(initialGraphData || null);
  const [isLoadingGraph, setIsLoadingGraph] = useState(!initialGraphData);
  const [internalSelectedNode, setInternalSelectedNode] = useState<GraphNode | null>(null);
  const [selectedBuildId, setSelectedBuildId] = useState<string>("1");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [processingSBOM, setProcessingSBOM] = useState(false);
  const [processingTimeout, setProcessingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [hasTriedToLoadGraph, setHasTriedToLoadGraph] = useState(false);
  const [hasAnyData, setHasAnyData] = useState(false);
  const [isAnimationActive, setIsAnimationActive] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [graphError, setGraphError] = useState<string | null>(null);

  // Consolidate all settings into a single state object to prevent cascading updates
  const [settings, setSettings] = useState<Settings>({
    filter: {
      nodeSizeFactor: 0.31,
      linkDistanceFactor: 0.62,
      chargeStrengthFactor: 0.3,
      showLabels: true,
      highlightVulnerabilities: true,
      selectedRiskLevels: ["critical", "high", "medium", "low", "safe", "unknown"] as RiskLevel[],
      minNodeConnections: 0,
      stickyNodes: false,
    },
    layout: {
      type: "force" as const,
      groupBy: "risk",
    },
    visibility: {
      visibility: {
        critical: true,
        high: true,
        medium: true,
        low: true,
        safe: true,
        unknown: true,
      }
    },
    opacity: {
      critical: 1,
      high: 1,
      medium: 1,
      low: 1,
      safe: 1,
      unknown: 1,
    }
  });

  const graphRef = useRef<GraphRef>(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()
  const { getAuthHeaders } = useAuth()

  // Load saved views from localStorage on mount
  useEffect(() => {
    try {
      const savedViewsData = localStorage.getItem("sbom-saved-views")
      if (savedViewsData) {
        setSavedViews(JSON.parse(savedViewsData))
      }
    } catch (error) {
      // Error handling for saved views
    }

    // Check for shared view in URL
    const sharedView = searchParams.get("view")
    if (sharedView) {
      try {
        const viewData = JSON.parse(decodeURIComponent(sharedView))

        // Apply the shared view settings
        if (viewData.filterSettings) setSettings(prev => ({ ...prev, filter: viewData.filterSettings }))
        if (viewData.layoutSettings) setSettings(prev => ({ ...prev, layout: viewData.layoutSettings }))
        if (viewData.visibilitySettings) setSettings(prev => ({ ...prev, visibility: viewData.visibilitySettings }))
        if (viewData.opacitySettings) setSettings(prev => ({ ...prev, opacity: viewData.opacitySettings }))
        if (viewData.selectedNode) setInternalSelectedNode(viewData.selectedNode)

        toast({
          title: "Shared view loaded",
          description: "The shared graph view has been applied.",
        })
      } catch (error) {
        toast({
          title: "Error loading shared view",
          description: "The shared view could not be loaded.",
          variant: "destructive",
        })
      }
    }
  }, [searchParams, toast])

  // On mount, check if there are any components
  useEffect(() => {
    async function checkForData() {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/components`, {
          headers: getAuthHeaders()
        });
        if (response.ok) {
          const data = await response.json();
          setHasAnyData(Array.isArray(data) && data.length > 0);
        } else {
          setHasAnyData(false);
        }
      } catch {
        setHasAnyData(false);
      }
    }
    checkForData();
  }, [refreshKey, getAuthHeaders]);

  // Update graphData when initialGraphData changes
  useEffect(() => {
    if (initialGraphData) {
      setGraphData(initialGraphData);
      setIsLoadingGraph(false);
    }
  }, [initialGraphData]);

  // Memoize handlers to prevent unnecessary re-renders
  const handleFilterChange = useCallback((newFilter: Partial<FilterSettings>) => {
    setSettings(prev => ({
      ...prev,
      filter: { ...prev.filter, ...newFilter }
    }));
  }, []);

  const handleLayoutChange = useCallback((newLayout: { type: string; groupBy: string }) => {
    setSettings(prev => ({
      ...prev,
      layout: { 
        ...prev.layout, 
        type: newLayout.type as "force" | "radial" | "hierarchical" | "circular",
        groupBy: newLayout.groupBy 
      }
    }));
  }, []);

  const handleVisibilityChange = useCallback((newVisibility: RiskVisibility) => {
    setSettings(prev => ({
      ...prev,
      visibility: {
        visibility: { ...prev.visibility.visibility, ...newVisibility }
      }
    }));
  }, []);

  const handleOpacityChange = useCallback((newOpacity: RiskOpacity) => {
    setSettings(prev => ({
      ...prev,
      opacity: { ...prev.opacity, ...newOpacity }
    }));
  }, []);

  const handleAnimationToggle = useCallback((active: boolean) => {
    setIsAnimationActive(active);
  }, []);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle node click (non-null)
  const handleNodeClick = useCallback((node: GraphNode) => {
    if (!node) return;
    
    // Ensure we have all required node properties
    if (!node.id || !node.name || !node.riskLevel) return;

    setInternalSelectedNode(node);
    parentOnNodeClick(node);
  }, [parentOnNodeClick]);

  // Use the external selectedNode if provided, otherwise use internal state
  const effectiveSelectedNode = externalSelectedNode || internalSelectedNode;

  // Handle node selection (possibly null)
  const handleNodeSelect = useCallback((node: GraphNode | null) => {
    // We don't need to do anything here since handleNodeClick handles the selection
  }, []);

  const handleTimelineChange = useCallback((value: number) => {
    // Convert the numeric value to TimelineData
    const newTimelineData: TimelineData = {
      timestamp: value,
      nodes: graphData?.nodes || [],
      links: graphData?.links || []
    };
    setTimelineData(newTimelineData);
  }, [graphData]);

  // Handle save view
  const handleSaveView = useCallback(() => {
    const view: SavedView = {
      id: crypto.randomUUID(),
      name: `View ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      settings: {
        filterSettings: settings.filter,
        layoutSettings: settings.layout,
        visibilitySettings: settings.visibility,
        opacitySettings: settings.opacity,
      },
    };
    setSavedViews(prev => [...prev, view]);
    toast({
      title: "View saved",
      description: "Your current view has been saved successfully.",
    });
  }, [settings, toast]);

  // Handle share view
  const handleShareView = useCallback(() => {
    const view: SavedView = {
      id: crypto.randomUUID(),
      name: `Shared View ${new Date().toLocaleString()}`,
      timestamp: new Date().toISOString(),
      settings: {
        filterSettings: settings.filter,
        layoutSettings: settings.layout,
        visibilitySettings: settings.visibility,
        opacitySettings: settings.opacity,
      },
    };
    const viewParam = encodeURIComponent(JSON.stringify(view));
    const shareableUrl = `${window.location.origin}${window.location.pathname}?view=${viewParam}`;
    return shareableUrl;
  }, [settings]);

  // Handle export graph
  const handleExportGraph = useCallback((format: 'png' | 'svg' | 'json', resolution: number) => {
    if (graphRef.current) {
      // Implement export logic here
      toast({
        title: "Graph exported",
        description: `Graph has been exported as ${format.toUpperCase()}.`,
      });
    }
  }, [toast]);

  // Handle reset view
  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.resetView();
      toast({
        title: "View reset",
        description: "The graph view has been reset to its default state.",
      });
    }
  }, [toast]);

  // Handle load view
  const handleLoadView = useCallback((view: SavedView) => {
    if (graphRef.current) {
      graphRef.current.loadSavedView(view);
      setSettings(prev => ({
        ...prev,
        filter: view.settings.filterSettings,
        layout: view.settings.layoutSettings,
        visibility: view.settings.visibilitySettings,
        opacity: view.settings.opacitySettings
      }));
      toast({
        title: "View loaded",
        description: "The selected view has been loaded successfully.",
      });
    }
  }, [toast]);

  // Handle focus on node
  const handleFocusNode = useCallback((nodeId: string) => {
    if (graphRef.current) {
      graphRef.current.focusNode(nodeId);
    }
  }, []);

  // Handle highlight path
  const handleHighlightPath = useCallback((nodeId: string) => {
    if (graphRef.current && effectiveSelectedNode) {
      graphRef.current.highlightPath(effectiveSelectedNode.id, nodeId);
    }
  }, [effectiveSelectedNode]);

  // Handle show dependencies
  const handleShowDependencies = useCallback((nodeId: string) => {
    if (graphRef.current) {
      graphRef.current.showDependencies(nodeId);
    }
  }, []);

  // Handle show dependents
  const handleShowDependents = useCallback((nodeId: string) => {
    if (graphRef.current) {
      graphRef.current.showDependents(nodeId);
    }
  }, []);

  // Add onCreateView handler
  const handleCreateView = useCallback((view: SavedView) => {
    setSavedViews(prev => [...prev, view]);
    toast({
      title: "View created",
      description: "New view has been created successfully.",
    });
  }, [toast]);

  const handleTempBuildIdSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const newBuildId = formData.get("buildIdInput") as string;
    if (newBuildId.trim()) {
      setSelectedBuildId(newBuildId.trim());
      setHasTriedToLoadGraph(true);
      toast({ title: "Loading graph", description: `Loading graph for Build ID: ${newBuildId.trim()}` });
    }
  };

  // Handler for successful SBOM upload
  const handleUploadSuccess = (buildId: string, projectName: string) => {
    setSelectedBuildId(buildId);
    setProcessingSBOM(true);
    setUploadDialogOpen(false);
    setRefreshKey((k) => k + 1);
    setHasTriedToLoadGraph(true);
    
    let attempts = 0;
    const maxAttempts = 15; // 15 attempts * 2 seconds = 30 seconds
    
    const poll = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/v1/sbom/repositories/${params.repositoryId}/sbom/${buildId}/graph`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          setProcessingSBOM(false);
          if (processingTimeout) clearTimeout(processingTimeout);
          handleLoadBuild();
          return;
        }
        
        attempts++;
        if (attempts < maxAttempts) {
          setProcessingTimeout(setTimeout(poll, 2000));
        } else {
          setProcessingSBOM(false);
          handleLoadBuild();
        }
      } catch (error) {
        setProcessingSBOM(false);
      }
    };
    
    poll();
  };

  const handleLoadBuild = async () => {
    if (!selectedBuildId || !params || !params.repositoryId) {
      toast({ title: "Error", description: "Repository ID is missing.", variant: "destructive" });
      return;
    }
    try {
      setIsLoadingGraph(true);
      setGraphError(null); // Clear any previous errors
      
      const response = await fetch(`${API_BASE_URL}/api/v1/sbom/repositories/${params.repositoryId}/sbom/${selectedBuildId}/graph`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load build data: ${response.statusText}`);
      }

      const data: GraphApiResponse = await response.json();

      if (!data.nodes || !data.links) {
        throw new Error('Invalid graph data received');
      }

      const nodes = data.nodes.map(node => ({
        id: node.id,
        name: node.name,
        version: node.version,
        riskLevel: node.riskLevel,
        purl: node.purl,
        size: node.size,
        vulnerabilityInfos: node.vulnerabilityInfos,
        x: node.x,
        y: node.y,
        fx: node.fx,
        fy: node.fy
      }));

      const links = data.links.map(link => ({
        source: nodes.find(n => n.id === link.source)!,
        target: nodes.find(n => n.id === link.target)!,
        value: typeof link.value === 'number' ? link.value : 1
      }));
      const graphData: GraphData = { nodes, links };

      setGraphData(graphData);
      setInternalSelectedNode(null);
      toast({ title: "Success", description: "Build data loaded successfully." });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to load build data";
      setGraphError(errorMessage);
      setGraphData(null);
      toast({ title: "Error", description: errorMessage, variant: "destructive" });
    } finally {
      setIsLoadingGraph(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-[350px_1fr] gap-0 min-h-screen">
      {/* Left sidebar with component details and legend */}
      <div className="border-r bg-background p-6 space-y-6">
        <div className="border rounded-lg bg-background shadow-sm">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold">Component Details</h2>
          </div>

          {effectiveSelectedNode ? (
            <>
              <div className="p-4 space-y-4">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="w-full">
                    <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
                    <TabsTrigger value="vulnerabilities" className="flex-1">Vulnerabilities</TabsTrigger>
                    <TabsTrigger value="dependencies" className="flex-1">Dependencies</TabsTrigger>
                  </TabsList>
                  <TabsContent value="overview" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="text-xl font-semibold mb-1">{effectiveSelectedNode.name}</h3>
                        <p className="text-sm text-muted-foreground">Version {effectiveSelectedNode.version || '1.0.0'}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium mb-2">Risk Level</h3>
                        <div className="inline-flex items-center px-3 py-1.5 rounded-md bg-blue-100 text-blue-700 font-medium">
                          {effectiveSelectedNode.riskLevel.charAt(0).toUpperCase() + effectiveSelectedNode.riskLevel.slice(1)}
                        </div>
                      </div>
                      {effectiveSelectedNode.description && (
                        <div>
                          <h3 className="text-sm font-medium mb-2">Description</h3>
                          <p className="text-sm text-muted-foreground">{effectiveSelectedNode.description}</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="vulnerabilities" className="mt-4">
                    {effectiveSelectedNode.vulnerabilityInfos && effectiveSelectedNode.vulnerabilityInfos.length > 0 ? (
                      <div className="space-y-3">
                        {effectiveSelectedNode.vulnerabilityInfos.map((vuln: Vulnerability, index: number) => (
                          <div key={index} className="p-4 border rounded-lg bg-card">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span className="font-medium">{vuln.id}</span>
                              </div>
                              <Badge variant={vuln.severity === 'critical' ? 'destructive' : 'default'}>
                                CVSS: {vuln.cvss}
                              </Badge>
                            </div>
                            {vuln.description && (
                              <p className="text-sm text-muted-foreground mb-4">{vuln.description}</p>
                            )}
                            <div className="space-y-3">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    disabled={isLoadingAiSuggestion}
                                    className="w-full flex items-center justify-center gap-2"
                                  >
                                    <BrainCircuit className={cn(
                                      "h-4 w-4",
                                      isLoadingAiSuggestion && "animate-pulse"
                                    )} />
                                    {isLoadingAiSuggestion ? "Analyzing..." : "Get AI Analysis"}
                                    <ChevronDown className="h-4 w-4 ml-2" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56">
                                  <DropdownMenuItem onClick={() => onAskAi?.(vuln, "remediation")}>
                                    Get Remediation Steps
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onAskAi?.(vuln, "alternatives")}>
                                    Find Alternative Packages
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => onAskAi?.(vuln, "risk")}>
                                    Analyze Risk Impact
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>

                              {aiSuggestion && (
                                <div className="mt-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Info className="h-4 w-4 text-blue-500" />
                                    <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                                      AI Analysis
                                    </span>
                                  </div>
                                  <div className="space-y-3 text-sm">
                                    <div>
                                      <h4 className="font-medium text-blue-700 dark:text-blue-300 mb-1">Analysis Results</h4>
                                      <p className="text-blue-600 dark:text-blue-200 whitespace-pre-wrap">{aiSuggestion}</p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground">No vulnerabilities found</p>
                      </div>
                    )}
                  </TabsContent>
                  <TabsContent value="dependencies" className="mt-4">
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium">Direct Dependencies</h3>
                          <span className="text-sm text-muted-foreground">{effectiveSelectedNode.dependencies ?? 0} total</span>
                        </div>
                        {effectiveSelectedNode.dependencies && effectiveSelectedNode.dependencies > 0 ? (
                          <div className="space-y-2">
                            <div className="p-4 border rounded-lg bg-muted/50">
                              <p className="text-sm mb-2">This component depends on {effectiveSelectedNode.dependencies} other components.</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFocusNode(effectiveSelectedNode.id)}
                                className="w-full"
                              >
                                View Dependencies
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">No direct dependencies</p>
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="text-sm font-medium">Dependent Components</h3>
                          <span className="text-sm text-muted-foreground">{effectiveSelectedNode.dependents ?? 0} total</span>
                        </div>
                        {effectiveSelectedNode.dependents && effectiveSelectedNode.dependents > 0 ? (
                          <div className="space-y-2">
                            <div className="p-4 border rounded-lg bg-muted/50">
                              <p className="text-sm mb-2">{effectiveSelectedNode.dependents} components depend on this component.</p>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleShowDependents(effectiveSelectedNode.id)}
                                className="w-full"
                              >
                                View Dependents
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 border rounded-lg bg-muted/50">
                            <p className="text-sm text-muted-foreground">No dependent components</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
              <div className="p-4 border-t">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleFocusNode(effectiveSelectedNode.id)}
                    className="flex-1"
                  >
                    Focus
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleHighlightPath(effectiveSelectedNode.id)}
                    className="flex-1"
                  >
                    Path
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-full bg-muted mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">Select a node to view details</p>
            </div>
          )}
        </div>

        <InteractiveLegend
          onVisibilityChange={handleVisibilityChange}
          onOpacityChange={handleOpacityChange}
        />
      </div>

      {/* Main graph area */}
      <div className="h-screen relative bg-background">
        {isLoadingGraph && (
          <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0 bg-white/80 z-10">
            <Skeleton className="h-16 w-16 rounded-full mx-auto animate-pulse" />
            <Skeleton className="h-4 w-[280px] mx-auto" />
            <Skeleton className="h-4 w-[220px] mx-auto" />
            <p className="text-muted-foreground mt-2">Loading graph, please wait...</p>
          </div>
        )}
        {(!graphData || graphData.nodes.length === 0) && !isLoadingGraph && (!graphError || !hasAnyData) && (
          <div className="flex flex-col items-center justify-center h-full w-full">
            <div className="text-lg text-gray-500">Please upload an SBOM to see the graph.</div>
          </div>
        )}
        {graphError && hasAnyData && (
          <Alert variant="destructive" className="mt-8 max-w-lg mx-auto">
            <AlertTitle>Error Loading Dependency Graph</AlertTitle>
            <AlertDescription>
              Failed to fetch graph data:<br />
              <div className="text-xs text-gray-500 mt-2">Ensure the build ID is correct and the backend service is running. Check console for more details.</div>
            </AlertDescription>
          </Alert>
        )}
        {!isLoadingGraph && !graphError && graphData && graphData.nodes.length > 0 && (
          <div className="h-full">
            <HighlyInteractiveGraph
              ref={graphRef}
              graphData={graphData}
              onNodeClick={handleNodeClick}
              onNodeSelect={handleNodeSelect}
              filterSettings={settings.filter}
              layoutSettings={settings.layout}
              visibilitySettings={settings.visibility}
              opacitySettings={settings.opacity}
              searchQuery={searchQuery}
              isAnimationActive={isAnimationActive}
              isLoading={isLoadingGraph}
            />
          </div>
        )}
        {!isLoadingGraph && !graphError && (!graphData || graphData.nodes.length === 0) && (
          <div className="flex flex-col items-center justify-center h-full w-full absolute inset-0">
            <ExternalLink className="h-12 w-12 text-muted-foreground mb-3" />
            <p className="text-muted-foreground text-lg">No graph data to display.</p>
            <p className="text-sm text-muted-foreground">
              {selectedBuildId ? `No components found for build ID: ${selectedBuildId}.` : "Please enter a Build ID to load data."}
            </p>
            <p className="text-xs text-gray-500 mt-2">Try uploading an SBOM for this build or check your backend data.</p>
          </div>
        )}
      </div>
    </div>
  )
}
