"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from "react";
import * as d3 from "d3";
import { useToast } from "@/components/ui/use-toast";
import { saveAs } from "file-saver";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// --- Constants for Performance Tuning (Relaxed to ensure rendering) ---
const NODE_LIMIT = 400; 
const EDGE_HIDE_NODE_THRESHOLD = 40; 
const MAX_SIMULATION_TICKS = 2000; 
const LABEL_VISIBILITY_ZOOM_THRESHOLD = 0.8; 
const EDGE_VISIBILITY_ZOOM_THRESHOLD = 0.7;  

// --- Type Definitions ---
export type RiskLevel = "critical" | "high" | "medium" | "low" | "safe" | "unknown";

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
  sbomId?: string;
  vulnerabilityInfos?: Array<{
    id: string;
    severity: string;
    cvss: string;
    description: string;
  }>;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
  [key: string]: any;
}

export interface GraphLink extends d3.SimulationLinkDatum<GraphNode> {
  source: GraphNode;
  target: GraphNode;
  value: number;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface FilterSettings {
  nodeSizeFactor?: number; 
  linkDistanceFactor?: number;
  chargeStrengthFactor?: number;
  showLabels?: boolean;
  highlightVulnerabilities?: boolean;
  selectedRiskLevels?: RiskLevel[];
  minNodeConnections?: number;
  stickyNodes?: boolean;
}

interface LayoutSettings {
  type?: "force" | "radial" | "hierarchical" | "circular";
  groupBy?: keyof GraphNode | string | null;
}

interface VisibilitySettings {
  visibility?: Record<RiskLevel, boolean>;
}

interface OpacitySettings {
  [key: string]: number;
}

interface TimelineEventData {
  timestamp: number;
}

export interface HighlyInteractiveGraphProps {
  graphData: GraphData | null;
  onNodeClick: (node: GraphNode) => void;
  onNodeSelect: (node: GraphNode | null) => void;
  filterSettings?: FilterSettings;
  layoutSettings?: LayoutSettings;
  visibilitySettings?: VisibilitySettings;
  opacitySettings?: OpacitySettings;
  searchQuery?: string;
  currentViewType?: "all" | "vulnerable" | "criticalPath";
  timelineData?: TimelineEventData | null;
  isAnimationActive?: boolean;
  isLoading?: boolean;
}

export interface GraphRef {
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
}

// --- Helper Functions ---
const getNodeColor = (node: GraphNode, isSelected: boolean): string => {
  if (isSelected) return "#1A202C"; // Selected component (black)
  if (node.highlighted) return "#E53E3E"; // Highlighted path (bright red)
  
  // If the node has vulnerabilities, use the highest severity
  if (node.vulnerabilityInfos && node.vulnerabilityInfos.length > 0) {
    const severities = node.vulnerabilityInfos.map(v => v.severity.toLowerCase());
    if (severities.includes("critical")) return "#B91C1C";
    if (severities.includes("high")) return "#EF4444";
    if (severities.includes("medium")) return "#F97316";
    if (severities.includes("low")) return "#FBBF24";
  }
  
  // If no vulnerabilities or unknown severity
  return "#3B82F6"; // Safe component (blue)
};

const getNodeSize = (node: GraphNode): number => {
  return node.size || 24; // Use provided size or default to 24
};

const getNodeTooltipContent = (node: GraphNode): string => {
  let content = `<div class="font-medium">${node.name}</div>`;
  if (node.version) {
    content += `<div class="text-sm text-gray-500">Version: ${node.version}</div>`;
  }
  if (node.vulnerabilityInfos && node.vulnerabilityInfos.length > 0) {
    content += `<div class="mt-2">Vulnerabilities:</div>`;
    node.vulnerabilityInfos.forEach(v => {
      content += `
        <div class="mt-1 p-1 rounded bg-gray-100">
          <div class="text-sm font-medium">${v.id}</div>
          <div class="text-xs">Severity: ${v.severity}</div>
          <div class="text-xs">CVSS: ${v.cvss}</div>
        </div>
      `;
    });
  }
  return content;
};

const defaultFilterSettings: Required<FilterSettings> = {
  nodeSizeFactor: 1.0, 
  linkDistanceFactor: 1.0,
  chargeStrengthFactor: 1.0,
  showLabels: true, 
  highlightVulnerabilities: true,
  selectedRiskLevels: ["critical", "high", "medium", "low", "safe", "unknown"],
  minNodeConnections: 0,
  stickyNodes: false,
};

const defaultLayoutSettings: Required<LayoutSettings> = { type: "force", groupBy: null };
const defaultVisibilitySettings: Required<VisibilitySettings> = {
  visibility: { critical: true, high: true, medium: true, low: true, safe: true, unknown: true },
};
const defaultOpacitySettings: Required<OpacitySettings> = { critical: 1, high: 1, medium: 1, low: 1, safe: 1, unknown: 1 };


const HighlyInteractiveGraph = forwardRef<GraphRef, HighlyInteractiveGraphProps>(
  (
    {
      graphData: initialGraphData,
      onNodeClick,
      onNodeSelect,
      filterSettings: fsProps = {},
      layoutSettings: lsProps = {},
      visibilitySettings: vsProps = {},
      opacitySettings: osProps = {},
      searchQuery = "",
      currentViewType = "all",
      isAnimationActive: isAnimationActiveProp = true,
      isLoading = false,
    },
    ref
  ) => {
    // --- Core Refs ---
    const svgRef = useRef<SVGSVGElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const zoomBehaviorRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);
    const currentTransformRef = useRef<d3.ZoomTransform>(d3.zoomIdentity);
    
    // --- Core State ---
    const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
    const [hoveredNode, setHoveredNode] = useState<GraphNode | null>(null);
    const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

    // --- Memoized Settings ---
    const filterSettings = useMemo(() => ({ ...defaultFilterSettings, ...fsProps }), [fsProps]);
    const layoutSettings = useMemo(() => ({ ...defaultLayoutSettings, ...lsProps }), [lsProps]);
    const visibilitySettings = useMemo(() => ({ ...defaultVisibilitySettings, ...vsProps }), [vsProps]);
    const opacitySettings = useMemo(() => ({ ...defaultOpacitySettings, ...osProps }), [osProps]);

    // --- Core Effects ---
    // 1. Handle container resize
    useEffect(() => {
      if (!containerRef.current) return;
      const observer = new ResizeObserver(() => {
        if (containerRef.current) {
          setDimensions({
            width: containerRef.current.clientWidth,
            height: containerRef.current.clientHeight,
          });
        }
      });
      observer.observe(containerRef.current);
      return () => observer.disconnect();
    }, []);

    // 2. Initialize zoom behavior
    useEffect(() => {
      if (!svgRef.current) return;
      
      const svg = d3.select(svgRef.current);
      const g = svg.select<SVGGElement>(".graph-container");
      
      const zoom = d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.1, 10])
        .on("zoom", (event) => {
          g.attr("transform", event.transform);
          currentTransformRef.current = event.transform;
        });

      svg.call(zoom);
      zoomBehaviorRef.current = zoom;

      return () => {
        svg.on(".zoom", null);
      };
    }, []);

    // --- Robust Filtering and Simulation Logic ---
    const processedGraphData = useMemo((): GraphData | null => {
      if (!initialGraphData || !initialGraphData.nodes || !initialGraphData.links) {
        return null;
      }

      let { nodes: rawNodes, links: rawLinks } = initialGraphData;

      // Deep clone nodes and process them
      let processedNodes: GraphNode[] = JSON.parse(JSON.stringify(rawNodes));
      
      // Create a map that can look up nodes by both string and numeric IDs
      const nodeMap = new Map();
      processedNodes.forEach(node => {
        // Calculate node properties
        node.degree = (node.dependencies || 0) + (node.dependents || 0);
        const nodeSizeFactor = filterSettings.nodeSizeFactor ?? 1;
        node.size = Math.max(24, Math.min(24 + (node.degree || 0) * 3.5, 80));

        // Store the node under both its string and numeric representations
        const numericId = parseInt(node.id);
        if (!isNaN(numericId)) {
          nodeMap.set(numericId, node);  // Store with numeric ID
        }
        nodeMap.set(node.id, node);      // Store with string ID
        nodeMap.set(String(node.id), node); // Store with forced string ID
      });
      
      // Process links while preserving node references
      let processedLinks = rawLinks.map(link => {
        // Get source and target nodes using either format
        const sourceNode = nodeMap.get(link.source) || nodeMap.get(String(link.source));
        const targetNode = nodeMap.get(link.target) || nodeMap.get(String(link.target));
        
        if (!sourceNode || !targetNode) {
          return null;
        }
        
        return {
          ...link,
          source: sourceNode,
          target: targetNode,
          value: 1
        };
      }).filter(Boolean) as GraphLink[];

      // --- Filtering logic for nodes only ---
      if (visibilitySettings.visibility) {
        processedNodes = processedNodes.filter(node =>
          visibilitySettings.visibility![node.riskLevel] !== false
        );
      }

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        processedNodes = processedNodes.filter(
          node => node.name.toLowerCase().includes(lowerQuery) ||
                  node.id.toLowerCase().includes(lowerQuery) ||
                  node.purl?.toLowerCase().includes(lowerQuery)
        );
      }

      // Filter based on view type
      if (currentViewType === "vulnerable") {
        const vulnerableNodeIds = new Set(
          processedNodes.filter(n => n.vulnerabilityInfos && n.vulnerabilityInfos.length > 0).map(n => n.id)
        );
        if (vulnerableNodeIds.size > 0) {
            const relatedNodes = new Set(vulnerableNodeIds);
            processedLinks.forEach(link => {
            const sourceId = (link.source as GraphNode).id;
            const targetId = (link.target as GraphNode).id;
                if (vulnerableNodeIds.has(sourceId)) relatedNodes.add(targetId);
                if (vulnerableNodeIds.has(targetId)) relatedNodes.add(sourceId);
            });
            processedNodes = processedNodes.filter(n => relatedNodes.has(n.id));
        } else {
            processedNodes = [];
        }
      } else if (currentViewType === "criticalPath") {
        const criticalHighVulnNodeIds = new Set(
          processedNodes.filter(n => 
            (n.riskLevel === "critical" || n.riskLevel === "high") && 
            n.vulnerabilityInfos && 
            n.vulnerabilityInfos.length > 0
          ).map(n => n.id)
        );
        if (criticalHighVulnNodeIds.size > 0) {
            const pathNodes = new Set(criticalHighVulnNodeIds);
             processedLinks.forEach(link => {
            const sourceId = (link.source as GraphNode).id;
            const targetId = (link.target as GraphNode).id;
                if (criticalHighVulnNodeIds.has(sourceId)) pathNodes.add(targetId);
                if (criticalHighVulnNodeIds.has(targetId)) pathNodes.add(sourceId);
            });
            processedNodes = processedNodes.filter(n => pathNodes.has(n.id));
        } else {
            processedNodes = [];
        }
      }

      const visibleNodeIds = new Set(processedNodes.map(n => n.id));

      // Only filter links based on visible nodes
      processedLinks = processedLinks.filter(link => {
        const sourceId = (link.source as GraphNode).id;
        const targetId = (link.target as GraphNode).id;
        return visibleNodeIds.has(sourceId) && visibleNodeIds.has(targetId);
      });

      if (processedNodes.length > NODE_LIMIT) {
        processedNodes = processedNodes.slice(0, NODE_LIMIT);
        const limitedNodeIds = new Set(processedNodes.map(n => n.id));
        processedLinks = processedLinks.filter(link => {
          const sourceId = (link.source as GraphNode).id;
          const targetId = (link.target as GraphNode).id;
            return limitedNodeIds.has(sourceId) && limitedNodeIds.has(targetId);
        });
      }

      return { nodes: processedNodes, links: processedLinks };
    }, [initialGraphData, visibilitySettings, searchQuery, currentViewType, filterSettings.minNodeConnections, filterSettings.nodeSizeFactor]);

    // --- Static Layout: Run simulation in useMemo and freeze nodes ---
    const staticLayout = useMemo(() => {
      if (!processedGraphData || processedGraphData.nodes.length === 0) {
        return null;
      }

      // Deep copy to avoid mutating original data
      const nodes = processedGraphData.nodes.map(n => ({ ...n }));
      const links = processedGraphData.links;  // No need to deep copy links since we don't modify them

      const isLargeGraph = nodes.length > 60;

      // Circular initial layout
      const radius = Math.min(dimensions.width, dimensions.height) / 1.7;
      nodes.forEach((node, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        node.x = dimensions.width / 2 + radius * Math.cos(angle);
        node.y = dimensions.height / 2 + radius * Math.sin(angle);
      });

      // Run simulation for N ticks
      const sim = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
          .id((d: any) => d.id)
          .distance((filterSettings.linkDistanceFactor ?? 1) * (isLargeGraph ? 400 : 150))
          .strength(isLargeGraph ? 0.03 : 0.02)
        )
        .force("charge", d3.forceManyBody()
          .strength((filterSettings.chargeStrengthFactor ?? 1) * (isLargeGraph ? -2000 : -1200))
          .distanceMax(isLargeGraph ? 1200 : 700)
        )
        .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2).strength(isLargeGraph ? 0.08 : 0.15))
        .force("collision", d3.forceCollide()
          .radius((d: any) => d.size + 15)
          .strength(1)
        )
        .alphaDecay(isLargeGraph ? 0.08 : 0.0228);

      // Run simulation synchronously
      sim.tick(MAX_SIMULATION_TICKS);
      sim.stop();

      // Freeze all nodes at their final positions
      nodes.forEach(node => {
        node.fx = node.x;
        node.fy = node.y;
      });

      return {
        nodes,
        links: links.map(link => ({
          ...link,
          source: nodes.find(n => n.id === (typeof link.source === 'object' ? link.source.id : link.source))!,
          target: nodes.find(n => n.id === (typeof link.target === 'object' ? link.target.id : link.target))!
        }))
      };
    }, [processedGraphData, dimensions.width, dimensions.height, filterSettings.linkDistanceFactor, filterSettings.chargeStrengthFactor]);

    // Update drag handlers to ensure complete node data
    const drag = useCallback((simulation: d3.Simulation<GraphNode, undefined>) => {
      const dragBehavior = d3.drag<SVGGElement, GraphNode>()
        .on("start", (event: any) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          
          const node = event.subject;
          if (!node?.id) {
            return;
          }

          if (typeof node.x === 'number') node.fx = node.x;
          if (typeof node.y === 'number') node.fy = node.y;
        })
        .on("drag", (event: any) => {
          const node = event.subject;
          if (!node?.id) return;

          if (typeof event.x === 'number') node.fx = event.x;
          if (typeof event.y === 'number') node.fy = event.y;
        })
        .on("end", (event: any) => {
          if (!event.active) simulation.alphaTarget(0);
          
          const node = event.subject;
          if (!node?.id) return;

          if (!filterSettings.stickyNodes) {
            node.fx = null;
            node.fy = null;
          }
        });

      return dragBehavior;
    }, [filterSettings.stickyNodes]);

    // Ensure proper data binding in useEffect
    useEffect(() => {
      if (!svgRef.current || !staticLayout?.nodes?.length) return;

      const svg = d3.select(svgRef.current);
      const container = svg.select<SVGGElement>(".graph-container");
      
      if (container.empty()) {
        return;
      }

      // Initialize simulation
      const simulation = d3.forceSimulation<GraphNode>(staticLayout.nodes);

      // Create node elements first
      const nodeElements = container
        .selectAll<SVGGElement, GraphNode>("g.node-group")
        .data(staticLayout.nodes, function(d) {
          return d ? d.id : this.getAttribute('data-node-id') || '';
        });

      // Enter new nodes
      const nodeEnter = nodeElements
        .enter()
        .append("g")
        .attr("class", "node-group cursor-pointer")
        .attr("data-node-id", d => d.id);

      // Update existing nodes
      nodeElements
        .merge(nodeEnter)
        .attr("transform", d => `translate(${d.x},${d.y})`);

      // Remove old nodes
      nodeElements.exit().remove();

      // Apply drag behavior to all nodes
      container
        .selectAll<SVGGElement, GraphNode>("g.node-group")
        .call(drag(simulation));

      return () => {
        simulation.stop();
      };
    }, [staticLayout, drag]);

    // Add zoom control functions
    const handleZoomIn = useCallback(() => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      const svg = d3.select(svgRef.current);
      const currentScale = currentTransformRef.current.k;
      const newScale = Math.min(currentScale * 1.5, 10);
      svg.transition().duration(300).call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.scale(newScale)
      );
    }, []);

    const handleZoomOut = useCallback(() => {
      if (!svgRef.current || !zoomBehaviorRef.current) return;
      const svg = d3.select(svgRef.current);
      const currentScale = currentTransformRef.current.k;
      const newScale = Math.max(currentScale / 1.5, 0.1);
      svg.transition().duration(300).call(
        zoomBehaviorRef.current.transform,
        d3.zoomIdentity.scale(newScale)
      );
    }, []);

    // Expose zoom functions through ref
    useImperativeHandle(ref, () => ({
      exportGraph: () => {},
      saveView: () => null,
      shareView: () => null,
      resetView: () => {},
      highlightPath: () => null,
      toggleAnimation: () => {},
      loadSavedView: () => {},
      focusNode: () => {},
      showDependencies: () => {},
      showDependents: () => {},
      zoomIn: handleZoomIn,
      zoomOut: handleZoomOut,
      centerGraph: () => {
        if (!svgRef.current || !zoomBehaviorRef.current) return;
        const transform = d3.zoomIdentity
          .translate(dimensions.width/2, dimensions.height/2)
          .scale(0.1);
        d3.select(svgRef.current)
          .transition()
          .duration(750)
          .call(zoomBehaviorRef.current.transform, transform);
             currentTransformRef.current = transform;
      }
    }), [dimensions.width, dimensions.height, handleZoomIn, handleZoomOut]);

    // Handle node selection through onNodeSelect prop if provided
    useEffect(() => {
      if (onNodeSelect && selectedNodeId) {
        const selectedNode = staticLayout?.nodes.find(n => n.id === selectedNodeId);
        if (selectedNode) {
          onNodeSelect(selectedNode);
        }
      }
    }, [selectedNodeId, staticLayout, onNodeSelect]);

    // --- Render ---
    if (isLoading) {
      return (
        <div className="relative w-full h-full border border-border rounded-lg bg-background">
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading graph...</p>
            </div>
          </div>
          <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomIn}
              className="bg-background/80 backdrop-blur-sm"
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
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleZoomOut}
              className="bg-background/80 backdrop-blur-sm"
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
              >
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Button>
          </div>
          <svg
            ref={svgRef}
            width={dimensions.width}
            height={dimensions.height}
            className="w-full h-full"
          >
            <g className="graph-container" />
          </svg>
        </div>
      );
    }

    if (!staticLayout || staticLayout.nodes.length === 0) {
      return (
        <div className="w-full h-full min-h-[400px] flex items-center justify-center border border-border rounded-lg bg-background">
          <p className="text-muted-foreground">No data to display.</p>
        </div>
      );
    }

    // Helper: check if all nodes have valid positions
    const allNodesPositioned = staticLayout.nodes.length > 0 && staticLayout.nodes.every(n => typeof n.x === 'number' && typeof n.y === 'number');

    return (
      <div ref={containerRef} className="relative w-full h-full border border-border rounded-lg bg-background">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/50 backdrop-blur-[2px] rounded-lg">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Loading graph...</p>
            </div>
          </div>
        )}
        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomIn}
            className="bg-background/80 backdrop-blur-sm"
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
            >
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleZoomOut}
            className="bg-background/80 backdrop-blur-sm"
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
            >
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Button>
        </div>
        <svg
          ref={svgRef}
          width={dimensions.width}
          height={dimensions.height}
          className="w-full h-full"
        >
          <defs>
            <marker
              id="arrowhead"
              viewBox="-0 -5 10 10"
              refX={10}
              refY={0}
              orient="auto"
              markerWidth={8}
              markerHeight={8}
            >
              <path d="M0,-5L10,0L0,5" className="fill-current text-gray-500" />
            </marker>
          </defs>
          <g className="graph-container">
            {/* Transparent background for pan/drag */}
            <rect
              width={dimensions.width}
              height={dimensions.height}
              fill="transparent"
              pointerEvents="all"
            />
            {allNodesPositioned && staticLayout.links.map((link, i) => {
              const source = link.source as GraphNode;
              const target = link.target as GraphNode;

              // Safety check for node positions
              if (!source || !target || source.x === undefined || source.y === undefined || target.x === undefined || target.y === undefined) {
                return null;
              }

              const dx = target.x - source.x;
              const dy = target.y - source.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance === 0) {
                return null;
              }

              // Calculate the endpoint to stop at the edge of the target node
              const targetRadius = (target.size || 24) + 2;  // Use default size if not set
              const ratio = (distance - targetRadius) / distance;
              const endX = source.x + dx * ratio;
              const endY = source.y + dy * ratio;

              return (
                <line
                  key={`${source.id}-${target.id}`}
                  x1={source.x}
                  y1={source.y}
                  x2={endX}
                  y2={endY}
                  stroke="#222"
                  strokeOpacity={0.6}
                  strokeWidth={Math.max(1, link.value || 1)}
                  markerEnd="url(#arrowhead)"
                />
              );
            })}
            {staticLayout.nodes.map((node) => (
              <g
                key={node.id}
                className="node-group cursor-pointer"
                transform={`translate(${node.x},${node.y})`}
                data-node-id={node.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedNodeId(node.id);
                  onNodeClick(node);
                }}
                onMouseEnter={e => {
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                  setHoveredNode(node);
                }}
                onMouseMove={e => {
                  setTooltipPos({ x: e.clientX, y: e.clientY });
                }}
                onMouseLeave={() => {
                  setHoveredNode(null);
                  setTooltipPos(null);
                }}
              >
                <circle
                  r={node.size}
                  fill={getNodeColor(node, node.id === selectedNodeId)}
                  stroke={node.id === selectedNodeId ? "black" : "#FFFFFF"}
                  strokeWidth={node.id === selectedNodeId ? 1.5 : 0.5}
                  style={{ opacity: opacitySettings[node.riskLevel] ?? 1 }}
                  data-node-id={node.id}
                />
              </g>
            ))}
          </g>
        </svg>
        {hoveredNode && tooltipPos && (
          <div
            style={{
              position: 'fixed',
              left: tooltipPos.x + 16,
              top: tooltipPos.y + 16,
              zIndex: 1000,
              background: 'white',
              border: '1.5px solid #222',
              borderRadius: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
              padding: 14,
              minWidth: 220,
              maxWidth: 340,
              pointerEvents: 'none',
            }}
          >
            <div className="font-bold text-base mb-1">{hoveredNode.name} {hoveredNode.version && <span className="text-xs text-gray-500">v{hoveredNode.version}</span>}</div>
            <div className="mb-1">
              <span className="font-medium">Risk: </span>
              <span style={{ color: getNodeColor(hoveredNode, false), fontWeight: 'bold', textTransform: 'capitalize' }}>{hoveredNode.riskLevel}</span>
            </div>
            <div className="mb-1">
              <span className="font-medium">Degree: </span>{hoveredNode.degree || 0}
            </div>
            <div className="mb-1">
              <span className="font-medium">Vulnerabilities:</span>
              {hoveredNode.vulnerabilityInfos && hoveredNode.vulnerabilityInfos.length > 0 ? (
                <ul className="ml-4 list-disc">
                  {hoveredNode.vulnerabilityInfos.slice(0, 3).map((vuln) => (
                    <li key={vuln.id} className="text-xs">
                      <span className="font-semibold">{vuln.id}</span> <span className="capitalize">({vuln.severity || 'N/A'})</span>
                    </li>
                  ))}
                  {hoveredNode.vulnerabilityInfos.length > 3 && <li className="text-xs">... ({hoveredNode.vulnerabilityInfos.length - 3} more)</li>}
                </ul>
              ) : (
                <span className="text-xs text-gray-500 ml-2">No vulnerabilities</span>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }
);

HighlyInteractiveGraph.displayName = "HighlyInteractiveGraph";
export { HighlyInteractiveGraph };
