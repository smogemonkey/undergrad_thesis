"use client"

import { useEffect, useRef, useState } from "react"
import * as d3 from "d3"
import { ZoomIn, ZoomOut, Maximize, Move } from "lucide-react"
import { Button } from "@/components/ui/button"
import { mockGraphData } from "@/lib/mock-data"

export function DependencyGraph() {
  const svgRef = useRef(null)
  const tooltipRef = useRef(null)
  const [selectedNode, setSelectedNode] = useState(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [activeControl, setActiveControl] = useState("pan")
  const [hoveredNode, setHoveredNode] = useState(null)

  useEffect(() => {
    if (!svgRef.current) return

    // Get container dimensions
    const width = svgRef.current.clientWidth
    const height = svgRef.current.clientHeight

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove()

    // Create tooltip div if it doesn't exist
    if (!tooltipRef.current) {
      tooltipRef.current = d3
        .select("body")
        .append("div")
        .attr(
          "class",
          "absolute bg-white p-3 rounded-md shadow-lg border border-gray-200 text-sm z-50 pointer-events-none opacity-0 transition-opacity",
        )
        .style("max-width", "250px")
    }

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
      .zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
        setZoomLevel(event.transform.k)
      })

    svg.call(zoom)

    // Create simulation
    const simulation = d3
      .forceSimulation(mockGraphData.nodes)
      .force(
        "link",
        d3
          .forceLink(mockGraphData.links)
          .id((d) => d.id)
          .distance(70),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide().radius((d) => d.size * 1.5),
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
      .selectAll("line")
      .data(mockGraphData.links)
      .join("line")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .attr("stroke-width", (d) => Math.sqrt(d.value))

    // Draw nodes
    const node = g
      .append("g")
      .selectAll("circle")
      .data(mockGraphData.nodes)
      .join("circle")
      .attr("r", (d) => d.size)
      .attr("fill", (d) => {
        if (d.id === selectedNode?.id) return "#000"
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
      .call(drag(simulation))
      .on("click", (event, d) => {
        setSelectedNode(d)
        // Dispatch a custom event that the parent component can listen for
        const customEvent = new CustomEvent("nodeSelected", { detail: d })
        window.dispatchEvent(customEvent)
        event.stopPropagation()
      })
      .on("mouseover", (event, d) => {
        setHoveredNode(d)

        // Show tooltip with node information in the style of the image
        tooltipRef.current
          .style("opacity", 1)
          .html(`
            <div class="font-medium">${d.name}</div>
            <div class="text-sm">Version: ${d.version || "1.0.0"}</div>
            <div class="flex items-center gap-1 mt-1">
              <span>Risk:</span>
              <span class="font-medium ${
                d.risk === "critical"
                  ? "text-red-600"
                  : d.risk === "high"
                    ? "text-red-500"
                    : d.risk === "medium"
                      ? "text-orange-500"
                      : d.risk === "low"
                        ? "text-yellow-500"
                        : "text-blue-500"
              }">
                ${d.risk.charAt(0).toUpperCase() + d.risk.slice(1)}
              </span>
            </div>
            <div class="mt-1">Vulnerabilities: ${d.vulnerabilities?.length || 0}</div>
            <div class="mt-1">Dependencies: ${d.dependencies?.length || 6}</div>
            <div class="mt-1">Dependents: ${d.dependents?.length || 1}</div>
          `)
          .style("left", event.pageX + 10 + "px")
          .style("top", event.pageY - 28 + "px")
      })
      .on("mousemove", (event) => {
        tooltipRef.current.style("left", event.pageX + 10 + "px").style("top", event.pageY - 28 + "px")
      })
      .on("mouseout", () => {
        setHoveredNode(null)
        tooltipRef.current.style("opacity", 0)
      })

    // Add titles for nodes (native browser tooltips as fallback)
    node.append("title").text((d) => d.name)

    // Add labels for nodes
    const labels = g
      .append("g")
      .selectAll("text")
      .data(mockGraphData.nodes.filter((d) => d.size > 10))
      .join("text")
      .attr("dx", (d) => d.size + 5)
      .attr("dy", ".35em")
      .text((d) => d.name)
      .style("font-size", "10px")
      .style("fill", "#333")

    // Update positions on simulation tick
    simulation.on("tick", () => {
      link
        .attr("x1", (d) => d.source.x)
        .attr("y1", (d) => d.source.y)
        .attr("x2", (d) => d.target.x)
        .attr("y2", (d) => d.target.y)

      node.attr("cx", (d) => d.x).attr("cy", (d) => d.y)

      labels.attr("x", (d) => d.x).attr("y", (d) => d.y)
    })

    // Drag behavior
    function drag(simulation) {
      function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart()
        event.subject.fx = event.subject.x
        event.subject.fy = event.subject.y
      }

      function dragged(event) {
        event.subject.fx = event.x
        event.subject.fy = event.y
      }

      function dragended(event) {
        if (!event.active) simulation.alphaTarget(0)
        event.subject.fx = null
        event.subject.fy = null
      }

      return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended)
    }

    // Add resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!svgRef.current) return
      const width = svgRef.current.clientWidth
      const height = svgRef.current.clientHeight

      d3.select(svgRef.current).select("svg").attr("viewBox", [0, 0, width, height])

      if (simulation) {
        simulation.force("center", d3.forceCenter(width / 2, height / 2))
        simulation.alpha(0.3).restart()
      }
    })

    if (svgRef.current) {
      resizeObserver.observe(svgRef.current)
    }

    // Clean up resize observer
    return () => {
      simulation.stop()
      if (svgRef.current) {
        resizeObserver.unobserve(svgRef.current)
      }
      window.removeEventListener("resize", handleResize)

      // Remove tooltip when component unmounts
      if (tooltipRef.current) {
        d3.select(tooltipRef.current).remove()
        tooltipRef.current = null
      }
    }
  }, [selectedNode])

  const handleZoomIn = () => {
    d3.select(svgRef.current).select("svg").transition().call(d3.zoom().scaleBy, 1.2)
  }

  const handleZoomOut = () => {
    d3.select(svgRef.current).select("svg").transition().call(d3.zoom().scaleBy, 0.8)
  }

  const handleReset = () => {
    d3.select(svgRef.current).select("svg").transition().call(d3.zoom().transform, d3.zoomIdentity)
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

      <div ref={svgRef} className="w-full h-full bg-white border rounded-lg overflow-hidden"></div>

      {/* Add a hint for users */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm p-2 rounded-md text-xs text-gray-700 border">
        Click on nodes to view details. Hover to see connections.
      </div>
    </div>
  )
}
