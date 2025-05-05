"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { EnhancedGraphControls } from "@/components/enhanced-graph-controls"
import { EnhancedNodeDetail } from "@/components/enhanced-node-detail"
import { InteractiveLegend } from "@/components/interactive-legend"
import { TimelineSlider } from "@/components/timeline-slider"
import { DependencyGraph } from "@/components/dependency-graph"
import { useToast } from "@/hooks/use-toast"
import { useSearchParams } from "next/navigation"

export function InteractiveDashboard() {
  const [selectedNode, setSelectedNode] = useState(null)
  const [filterSettings, setFilterSettings] = useState({
    nodeSize: 50,
    linkDistance: 70,
    chargeStrength: 30,
    showLabels: true,
    highlightVulnerabilities: true,
    selectedRiskLevels: ["critical", "high", "medium", "low", "safe"],
    minNodeConnections: 0,
  })
  const [layoutSettings, setLayoutSettings] = useState({
    type: "force-directed",
    groupBy: "none",
  })
  const [visibilitySettings, setVisibilitySettings] = useState({
    visibility: {
      critical: true,
      high: true,
      medium: true,
      low: true,
      safe: true,
    },
  })
  const [opacitySettings, setOpacitySettings] = useState({
    critical: 100,
    high: 100,
    medium: 100,
    low: 100,
    safe: 100,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [isAnimationActive, setIsAnimationActive] = useState(true)
  const [timelineData, setTimelineData] = useState(null)
  const [savedViews, setSavedViews] = useState([])

  const graphRef = useRef(null)
  const { toast } = useToast()
  const searchParams = useSearchParams()

  // Listen for node selection events from the graph
  useEffect(() => {
    const handleNodeSelected = (event) => {
      setSelectedNode(event.detail)
    }

    window.addEventListener("nodeSelected", handleNodeSelected)

    return () => {
      window.removeEventListener("nodeSelected", handleNodeSelected)
    }
  }, [])

  // Load saved views from localStorage on mount
  useEffect(() => {
    try {
      const savedViewsData = localStorage.getItem("sbom-saved-views")
      if (savedViewsData) {
        setSavedViews(JSON.parse(savedViewsData))
      }
    } catch (error) {
      console.error("Failed to load saved views", error)
    }

    // Check for shared view in URL
    const sharedView = searchParams.get("view")
    if (sharedView) {
      try {
        const viewData = JSON.parse(decodeURIComponent(sharedView))

        // Apply the shared view settings
        if (viewData.filterSettings) setFilterSettings(viewData.filterSettings)
        if (viewData.layoutSettings) setLayoutSettings(viewData.layoutSettings)
        if (viewData.visibilitySettings) setVisibilitySettings(viewData.visibilitySettings)
        if (viewData.opacitySettings) setOpacitySettings(viewData.opacitySettings)
        if (viewData.selectedNode) setSelectedNode(viewData.selectedNode)

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

  // Handle node selection
  const handleNodeSelect = useCallback((node) => {
    setSelectedNode(node)
  }, [])

  // Handle filter changes
  const handleFilterChange = useCallback((settings) => {
    setFilterSettings(settings)
  }, [])

  // Handle layout changes
  const handleLayoutChange = useCallback((settings) => {
    setLayoutSettings(settings)
  }, [])

  // Handle visibility changes
  const handleVisibilityChange = useCallback((settings) => {
    setVisibilitySettings({ visibility: settings })
  }, [])

  // Handle opacity changes
  const handleOpacityChange = useCallback((settings) => {
    setOpacitySettings(settings)
  }, [])

  // Handle search
  const handleSearch = useCallback((query) => {
    setSearchQuery(query)
  }, [])

  // Handle animation toggle
  const handleAnimationToggle = useCallback((active) => {
    setIsAnimationActive(active)
  }, [])

  // Handle timeline change
  const handleTimelineChange = useCallback((data) => {
    setTimelineData(data)
  }, [])

  // Handle save view
  const handleSaveView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.saveView()
    }
  }, [])

  // Handle share view
  const handleShareView = useCallback(() => {
    if (graphRef.current) {
      return graphRef.current.shareView()
    }
  }, [])

  // Handle export graph
  const handleExportGraph = useCallback((format, resolution) => {
    if (graphRef.current) {
      graphRef.current.exportGraph(format)
    }
  }, [])

  // Handle reset view
  const handleResetView = useCallback(() => {
    if (graphRef.current) {
      graphRef.current.resetView()
    }
  }, [])

  // Handle load view
  const handleLoadView = useCallback(
    (view) => {
      if (graphRef.current) {
        const savedView = graphRef.current.loadSavedView()
        if (savedView) {
          // Apply the saved view settings
          if (savedView.filterSettings) setFilterSettings(savedView.filterSettings)
          if (savedView.layoutSettings) setLayoutSettings(savedView.layoutSettings)
          if (savedView.visibilitySettings) setVisibilitySettings(savedView.visibilitySettings)
          if (savedView.opacitySettings) setOpacitySettings(savedView.opacitySettings)
          if (savedView.selectedNode) setSelectedNode(savedView.selectedNode)

          toast({
            title: "View loaded",
            description: `The view "${view.name}" has been loaded successfully.`,
          })
        }
      }
    },
    [toast],
  )

  // Handle focus on node
  const handleFocusNode = useCallback(
    (nodeId) => {
      // Implementation would zoom and center on the node
      toast({
        title: "Node focused",
        description: `Focused on node ${nodeId}`,
      })
    },
    [toast],
  )

  // Handle highlight path
  const handleHighlightPath = useCallback(
    (nodeId) => {
      // Implementation would find and highlight paths to this node
      toast({
        title: "Path highlighted",
        description: `Highlighted paths to node ${nodeId}`,
      })
    },
    [toast],
  )

  // Handle show dependencies
  const handleShowDependencies = useCallback(
    (nodeId) => {
      // Implementation would filter to show only dependencies of this node
      setSearchQuery(`dependencies:${nodeId}`)
      toast({
        title: "Dependencies shown",
        description: `Showing dependencies of ${nodeId}`,
      })
    },
    [toast],
  )

  // Handle show dependents
  const handleShowDependents = useCallback(
    (nodeId) => {
      // Implementation would filter to show only dependents of this node
      setSearchQuery(`dependents:${nodeId}`)
      toast({
        title: "Dependents shown",
        description: `Showing dependents of ${nodeId}`,
      })
    },
    [toast],
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
      <div className="md:col-span-1 space-y-6">
        <EnhancedGraphControls
          onFilterChange={handleFilterChange}
          onLayoutChange={handleLayoutChange}
          onAnimationToggle={handleAnimationToggle}
          onHighlightChange={() => {}}
          isAnimationActive={isAnimationActive}
          onSearchNode={handleSearch}
          onSaveView={handleSaveView}
          onShareView={handleShareView}
          onExportGraph={handleExportGraph}
          onResetView={handleResetView}
          onLoadView={handleLoadView}
          savedViews={savedViews}
        />

        <EnhancedNodeDetail
          selectedNode={selectedNode}
          onFocusNode={handleFocusNode}
          onHighlightPath={handleHighlightPath}
          onShowDependents={handleShowDependents}
          onShowDependencies={handleShowDependencies}
        />

        <InteractiveLegend onVisibilityChange={handleVisibilityChange} onOpacityChange={handleOpacityChange} />

        <TimelineSlider onTimelineChange={handleTimelineChange} />
      </div>

      <div className="md:col-span-3 h-[600px]">
        <Card className="h-full">
          <CardContent className="p-0 h-full">
            <DependencyGraph />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
