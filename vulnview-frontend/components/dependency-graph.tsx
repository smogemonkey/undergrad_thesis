"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { ZoomIn, ZoomOut, Maximize, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockGraphData } from "@/lib/mock-data"
import { MutableRefObject } from "react"

interface GraphNode {
  id: string;
  name: string;
  size: number;
  risk: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphLink {
  source: GraphNode;
  target: GraphNode;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export function DependencyGraph({ projectId }: { projectId: string }) {
  const svgRef = useRef<SVGSVGElement | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [activeControl, setActiveControl] = useState("pan")
  const [graphData, setGraphData] = useState<GraphData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchGraphData = async () => {
      try {
        const response = await fetch(`/api/v1/dependencies/graph/${projectId}`)
        if (!response.ok) {
          throw new Error('Failed to fetch graph data')
        }
        const data = await response.json()
        setGraphData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchGraphData()
  }, [projectId])

  useEffect(() => {
    if (!svgRef.current || !graphData) return

    // Get container dimensions
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;")

    const g = svg.append("g")

    // Create zoom behavior
    const zoom = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
        setZoomLevel(event.transform.k)
      })

    svg.call(zoom)

    // Create simulation
    const simulation = d3
      .forceSimulation<GraphNode>()
      .force(
        "link",
        d3
          .forceLink<GraphNode, GraphLink>(graphData.links)
          .id((d) => d.id)
          .distance(70),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide<GraphNode>().radius((d) => d.size * 1.5),
      )

    // Add window resize handler
    const handleResize = () => {
      if (!svgRef.current) return
      const newWidth = svgRef.current.clientWidth
      const newHeight = svgRef.current.clientHeight

      svg.attr("viewBox", [0, 0, newWidth, newHeight])
      simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2))
      simulation.alpha(0.3).restart()
    }

    window.addEventListener("resize", handleResize)

    // Draw links
    const link = g
      .append("g")
      .selectAll<SVGLineElement, GraphLink>("line")
      .data(graphData.links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value))

    // Draw nodes
    const node = g
      .append("g")
      .selectAll<SVGCircleElement, GraphNode>("circle")
      .data(graphData.nodes)
      .join("circle")
      .attr("r", (d) => d.size)
      .attr("fill", (d) => {
        if (d.id === selectedNode) return "#000"
        switch (d.risk) {
          case "critical":
            return "#991b1b"
          case "high":
            return "#dc2626"
          case "medium":
            return "#f97316"
          case "low":
            return "#eab308"
          default:
            return "#3b82f6"
        }
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)
      .call(drag(simulation) as any)
      .on("click", (event, d) => {
        setSelectedNode(d.id === selectedNode ? null : d.id)
        event.stopPropagation()
      })

    // Add titles for nodes
    node.append("title").text((d) => d.name)

    // Add labels for nodes
    const labels = g
      .append("g")
      .selectAll<SVGTextElement, GraphNode>("text")
      .data(graphData.nodes.filter((d) => d.size > 10))
      .join("text")
      .attr("dx", (d) => d.size + 5)
      .attr("dy", ".35em")
      .text((d) => d.name)
      .style("font-size", "10px")
      .style("fill", "#333")

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x!)
        .attr("y1", (d) => d.source.y!)
        .attr("x2", (d) => d.target.x!)
        .attr("y2", (d) => d.target.y!)

      node.attr("cx", (d) => d.x!).attr("cy", (d) => d.y!)

      labels.attr("x", (d) => d.x!).attr("y", (d) => d.y!)
    })

    // Drag behavior
    function drag(simulation: d3.Simulation<GraphNode, undefined>) {
      function dragstarted(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      function dragged(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
        event.subject.fx = event.x
        event.subject.fy = event.y
      }

      function dragended(event: d3.D3DragEvent<SVGCircleElement, GraphNode, GraphNode>) {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      }

      return d3.drag<SVGCircleElement, GraphNode>()
        .on("start", dragstarted)
        .on("drag", dragged)
        .on("end", dragended)
    }

    // Cleanup
    return () => {
      simulation.stop()
      window.removeEventListener("resize", handleResize)
    }
  }, [selectedNode, graphData])

  const handleZoomIn = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    svg.transition()
      .duration(300)
      .call(zoom.scaleBy, 1.2);
  };

  const handleZoomOut = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    svg.transition()
      .duration(300)
      .call(zoom.scaleBy, 0.8);
  };

  const handleReset = () => {
    if (!svgRef.current) return;
    const svg = d3.select(svgRef.current);
    const zoom = d3.zoom<SVGSVGElement, unknown>();
    svg.transition()
      .duration(300)
      .call(zoom.transform, d3.zoomIdentity);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-full">Loading...</div>;
  }

  if (error) {
    return <div className="flex items-center justify-center h-full text-red-500">{error}</div>;
  }

  return (
    <div className="relative h-full">
      <div className="absolute right-4 top-4 flex flex-col gap-2 z-10">
        <Button size="icon" variant="outline" onClick={handleZoomIn}>
          <ZoomIn className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={handleZoomOut}>
          <ZoomOut className="h-4 w-4" />
        </Button>
        <Button size="icon" variant="outline" onClick={handleReset}>
          <Maximize className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant={activeControl === "pan" ? "default" : "outline"}
          onClick={() => setActiveControl("pan")}
        >
          <Move className="h-4 w-4" />
        </Button>
      </div>
      <div className="w-full h-full bg-white border rounded-lg">
        <svg ref={svgRef} className="w-full h-full"></svg>
      </div>
    </div>
  );
}
