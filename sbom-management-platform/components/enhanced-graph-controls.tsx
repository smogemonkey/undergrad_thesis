"use client"

import { useState, useEffect } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ChevronDown, ChevronUp, Sliders, Search, Play, Pause, RotateCcw } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { GraphActionsManager } from "@/components/graph-actions-manager"

export function EnhancedGraphControls({
  onFilterChange,
  onLayoutChange,
  onAnimationToggle,
  onHighlightChange,
  isAnimationActive = true,
  onSearchNode,
  onSaveView,
  onShareView,
  onExportGraph,
  onResetView,
  onLoadView,
  savedViews = [],
}) {
  const [isOpen, setIsOpen] = useState(true)
  const [nodeSize, setNodeSize] = useState(50)
  const [linkDistance, setLinkDistance] = useState(70)
  const [chargeStrength, setChargeStrength] = useState(30)
  const [showLabels, setShowLabels] = useState(true)
  const [highlightVulnerabilities, setHighlightVulnerabilities] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedRiskLevels, setSelectedRiskLevels] = useState(["critical", "high", "medium", "low", "safe"])
  const [minNodeConnections, setMinNodeConnections] = useState(0)
  const [layoutType, setLayoutType] = useState("force-directed")
  const [groupBy, setGroupBy] = useState("none")
  const [savedViewsList, setSavedViewsList] = useState(savedViews)

  // Handle filter changes
  useEffect(() => {
    onFilterChange?.({
      nodeSize,
      linkDistance,
      chargeStrength,
      showLabels,
      highlightVulnerabilities,
      selectedRiskLevels,
      minNodeConnections,
    })
  }, [
    nodeSize,
    linkDistance,
    chargeStrength,
    showLabels,
    highlightVulnerabilities,
    selectedRiskLevels,
    minNodeConnections,
    onFilterChange,
  ])

  // Handle layout changes
  useEffect(() => {
    onLayoutChange?.({
      type: layoutType,
      groupBy,
    })
  }, [layoutType, groupBy, onLayoutChange])

  // Handle search
  const handleSearch = () => {
    onSearchNode?.(searchQuery)
  }

  // Handle risk level toggle
  const toggleRiskLevel = (level) => {
    if (selectedRiskLevels.includes(level)) {
      setSelectedRiskLevels(selectedRiskLevels.filter((l) => l !== level))
    } else {
      setSelectedRiskLevels([...selectedRiskLevels, level])
    }
  }

  // Handle highlight change
  useEffect(() => {
    onHighlightChange?.({
      highlightVulnerabilities,
    })
  }, [highlightVulnerabilities, onHighlightChange])

  // Handle creating a new saved view
  const handleCreateView = (view) => {
    const updatedViews = [...savedViewsList, view]
    setSavedViewsList(updatedViews)

    // Save to localStorage
    try {
      localStorage.setItem("sbom-saved-views", JSON.stringify(updatedViews))
    } catch (error) {
      console.error("Failed to save views to localStorage", error)
    }
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <button
        className="flex items-center justify-between w-full p-4 font-medium text-left bg-gray-50 border-b"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className="bg-gray-200 p-1.5 rounded-lg mr-2">
            <Sliders className="h-4 w-4 text-gray-700" />
          </div>
          Interactive Controls
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4">
          <Tabs defaultValue="visualization" className="mt-2">
            <TabsList className="w-full mb-4 bg-gray-100">
              <TabsTrigger value="visualization" className="flex-1">
                Visualization
              </TabsTrigger>
              <TabsTrigger value="filters" className="flex-1">
                Filters
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex-1">
                Layout
              </TabsTrigger>
              <TabsTrigger value="actions" className="flex-1">
                Actions
              </TabsTrigger>
            </TabsList>

            <TabsContent value="visualization" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Node Size</label>
                  <span className="text-xs text-gray-500">{nodeSize}%</span>
                </div>
                <Slider value={[nodeSize]} max={100} step={1} onValueChange={(value) => setNodeSize(value[0])} />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Link Distance</label>
                  <span className="text-xs text-gray-500">{linkDistance}%</span>
                </div>
                <Slider
                  value={[linkDistance]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setLinkDistance(value[0])}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Charge Strength</label>
                  <span className="text-xs text-gray-500">{chargeStrength}%</span>
                </div>
                <Slider
                  value={[chargeStrength]}
                  max={100}
                  step={1}
                  onValueChange={(value) => setChargeStrength(value[0])}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Show Labels</label>
                <Switch checked={showLabels} onCheckedChange={setShowLabels} />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Highlight Vulnerabilities</label>
                <Switch
                  checked={highlightVulnerabilities}
                  onCheckedChange={(checked) => {
                    setHighlightVulnerabilities(checked)
                  }}
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm">Animation</label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAnimationToggle?.(!isAnimationActive)}
                  className={isAnimationActive ? "border-gray-300" : "border-gray-300"}
                >
                  {isAnimationActive ? (
                    <>
                      <Pause className="h-4 w-4 mr-1" /> Pause
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-1" /> Play
                    </>
                  )}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="filters" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Search Components</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1 border-gray-200"
                  />
                  <Button size="sm" onClick={handleSearch}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Risk Levels</label>
                <div className="flex flex-wrap gap-2">
                  <Badge
                    variant={selectedRiskLevels.includes("critical") ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRiskLevel("critical")}
                  >
                    Critical
                  </Badge>
                  <Badge
                    variant={selectedRiskLevels.includes("high") ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRiskLevel("high")}
                  >
                    High
                  </Badge>
                  <Badge
                    variant={selectedRiskLevels.includes("medium") ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRiskLevel("medium")}
                  >
                    Medium
                  </Badge>
                  <Badge
                    variant={selectedRiskLevels.includes("low") ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRiskLevel("low")}
                  >
                    Low
                  </Badge>
                  <Badge
                    variant={selectedRiskLevels.includes("safe") ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleRiskLevel("safe")}
                  >
                    Safe
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm">Min Connections</label>
                  <span className="text-xs text-gray-500">{minNodeConnections}</span>
                </div>
                <Slider
                  value={[minNodeConnections]}
                  max={10}
                  step={1}
                  onValueChange={(value) => setMinNodeConnections(value[0])}
                />
              </div>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Layout Type</label>
                <Select value={layoutType} onValueChange={setLayoutType}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select layout" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="force-directed">Force Directed</SelectItem>
                    <SelectItem value="radial">Radial</SelectItem>
                    <SelectItem value="hierarchical">Hierarchical</SelectItem>
                    <SelectItem value="circular">Circular</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Group By</label>
                <Select value={groupBy} onValueChange={setGroupBy}>
                  <SelectTrigger className="border-gray-200">
                    <SelectValue placeholder="Select grouping" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No Grouping</SelectItem>
                    <SelectItem value="risk">Risk Level</SelectItem>
                    <SelectItem value="license">License Type</SelectItem>
                    <SelectItem value="namespace">Namespace</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <GraphActionsManager
                  onSaveView={onSaveView}
                  onShareView={onShareView}
                  onExportGraph={onExportGraph}
                  onLoadView={onLoadView}
                  savedViews={savedViewsList}
                  onCreateView={handleCreateView}
                />

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" className="w-full" onClick={onResetView}>
                        <RotateCcw className="h-4 w-4 mr-2" />
                        Reset View
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Reset to default view</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  )
}
