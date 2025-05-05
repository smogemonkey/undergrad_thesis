import React from "react"
;('"use client')

import { useEffect, useRef, useState, useCallback } from "react"
import * as d3 from "d3"

export function HighlyInteractiveGraph(
  { onNodeSelect, filterSettings, layoutSettings, visibilitySettings, opacitySettings, searchQuery, timelineData },
  ref,
) {
  const svgRef = useRef(null)
  const containerRef = useRef(null)
  const [zoomLevel, setZoomLevel] = useState(1)
  const [activeControl, setActiveControl] = useState("pan")
  const [hoveredNode, setHoveredNode] = useState(null)
  const svgTransformRef = useRef(d3.zoomIdentity)
  const simulationRef = useRef(null)
  const [highlightedPath, setHighlightedPath] = useState(null)
  const [isAnimationActive, setIsAnimationActive] = useState(true)

  const processGraphData = useCallback(() => {
    // Placeholder for graph data processing logic
    return { nodes: [], links: [] }
  }, [])

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return

    // Get container dimensions
    const width = containerRef.current.clientWidth
    const height = containerRef.current.clientHeight

    // Clear previous graph
    d3.select(svgRef.current).selectAll("*").remove()

    const svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("viewBox", [0, 0, width, height])
      .attr("style", "max-width: 100%; height: auto;")

    // Add a background for better visibility
    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "white")

    // Create a group for the graph elements
    const g = svg.append("g")

    // Create zoom behavior
    const zoom = d3
      .zoom()
      .scaleExtent([0.1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform)
        setZoomLevel(event.transform.k)
        svgTransformRef.current = event.transform
      })

    svg.call(zoom)

    // Apply stored transform if available
    if (svgTransformRef.current) {
      svg.call(zoom.transform, svgTransformRef.current)
    }

    // Process data based on current filters
    const { nodes, links } = processGraphData()

    // Create simulation with adjusted parameters based on settings
    const simulation = d3
      .forceSimulation(nodes)
      .force(
        "link",
        d3
          .forceLink(links)
          .id((d) => d.id)
          .distance(70),
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force(
        "collide",
        d3.forceCollide().radius((d) => 5),
      )

    // Add window resize handler
    const handleResize = () => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight

      svg.attr("viewBox", [0, 0, newWidth, newHeight])
      simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2))
      simulation.alpha(0.3).restart()
    }

    window.addEventListener("resize", handleResize)

    // Add resize observer for more precise size tracking
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return
      const newWidth = containerRef.current.clientWidth
      const newHeight = containerRef.current.clientHeight

      svg.attr("viewBox", [0, 0, newWidth, newHeight])

      if (simulation) {
        simulation.force("center", d3.forceCenter(newWidth / 2, newHeight / 2))
        simulation.alpha(0.3).restart()
      }
    })

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current)
    }

    // Store simulation reference for later use
    simulationRef.current = simulation

    // Create a gradient for links
    const defs = svg.append("defs")

    // Create gradient for links
    const linkGradient = defs
      .append("linearGradient")
      .attr("id", "linkGradient")
      .attr("gradientUnits", "userSpaceOnUse")

    linkGradient.append("stop").attr("offset", "0%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.8)

    linkGradient.append("stop").attr("offset", "100%").attr("stop-color", "#3b82f6").attr("stop-opacity", 0.2)

    // Draw links with curved paths
    const link = g
      .append("g")
      .attr("stroke", "#999")
      .attr("stroke-opacity", 0.6)
      .selectAll("path")
      .data(links)
      .join("path")
      .attr("stroke", "url(#linkGradient)")
      .attr("stroke-width", (d) => Math.sqrt(d.value))
      .attr("fill", "none")

    // Create node group
    const nodeGroup = g
      .append("g")
      .selectAll("g")
      .data(nodes)
      .join("g")
      .call(drag(simulation))
      .on("click", (event, d) => {
        onNodeSelect?.(d.id)
        event.stopPropagation()
      })
      .on("mouseover", (event, d) => {
        setHoveredNode(d.id)
      })
      .on("mouseout", () => {
        setHoveredNode(null)
      })

    // Add pulse animation for nodes
    const pulseGradients = defs
      .selectAll("radialGradient")
      .data(nodes)
      .join("radialGradient")
      .attr("id", (d) => `pulse-gradient-${d.id}`)
      .attr("cx", "50%")
      .attr("cy", "50%")
      .attr("r", "50%")

    pulseGradients
      .append("stop")
      .attr("offset", "0%")
      .attr("stop-color", (d) => "#3b82f6")
      .attr("stop-opacity", 0.9)

    pulseGradients
      .append("stop")
      .attr("offset", "100%")
      .attr("stop-color", (d) => "#3b82f6")
      .attr("stop-opacity", 0.3)

    // Add pulse circles (larger than the node)
    nodeGroup
      .append("circle")
      .attr("class", "pulse")
      .attr("r", 5 * 1.3)
      .attr("fill", (d) => `url(#pulse-gradient-${d.id})`)
      .attr("opacity", 0.7)

    // Draw main nodes
    nodeGroup
      .append("circle")
      .attr("class", "node")
      .attr("r", 5)
      .attr("fill", (d) => "#3b82f6")
      .attr("stroke", "#fff")
      .attr("stroke-width", 1.5)

    // Add titles for nodes
    nodeGroup.append("title").text((d) => d.name)

    // Add labels for nodes
    const labels = g
      .append("g")
      .selectAll("text")
      .data(nodes.filter((d) => d.size > 10))
      .join("text")
      .attr("dx", (d) => 5 + 5)
      .attr("dy", ".35em")
      .text((d) => d.name)
      .style("font-size", "10px")
      .style("fill", "#333")
      .style("pointer-events", "none")

    // Add bubbling animation
    function bubbleAnimation() {
      nodeGroup
        .select(".pulse")
        .transition()
        .duration(() => Math.random() * 2000 + 1000)
        .attr("r", 5 * 1.3 + Math.random() * 5)
        .transition()
        .duration(() => Math.random() * 2000 + 1000)
        .attr("r", 5 * 1.3)
        .on("end", bubbleAnimation)
    }

    bubbleAnimation()

    // Update positions on simulation tick
    simulation.on("tick", () => {
      // Update link paths
      link.attr("d", (d) => {
        const dx = d.target.x - d.source.x
        const dy = d.target.y - d.source.y
        const dr = Math.sqrt(dx * dx + dy * dy) * 2
        return `M${d.source.x},${d.source.y}A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`
      })

      // Update node positions
      nodeGroup.attr("transform", (d) => `translate(${d.x},${d.y})`)

      // Update label positions
      labels.attr("x", (d) => d.x).attr("y", (d) => d.y)

      // Highlight connections for hovered node
      if (hoveredNode) {
        link.attr("stroke-opacity", (d) => {
          return d.source.id === hoveredNode || d.target.id === hoveredNode ? 1 : 0.2
        })
        nodeGroup.attr("opacity", (d) => {
          if (d.id === hoveredNode) return 1
          // Check if this node is connected to the hovered node
          const isConnected = links.some(
            (link) =>
              (link.source.id === hoveredNode && link.target.id === d.id) ||
              (link.target.id === hoveredNode && link.source.id === d.id),
          )
          return isConnected ? 1 : 0.3
        })
      } else {
        link.attr("stroke-opacity", 0.6)
        nodeGroup.attr("opacity", 1)
      }
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

    // Cleanup
    return () => {
      simulation.stop()
      window.removeEventListener("resize", handleResize)
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current)
      }
    }
  }, [
    filterSettings,
    layoutSettings,
    visibilitySettings,
    opacitySettings,
    searchQuery,
    selectedNode,
    hoveredNode,
    highlightedPath,
    isAnimationActive,
    processGraphData,
    onNodeSelect,
  ])

  const handleZoomIn = () => {
    d3.select(svgRef.current).transition().call(d3.zoom().scaleBy, 1.2)
  }

  const handleZoomOut = () => {
    d3.select(svgRef.current).transition().call(d3.zoom().scaleBy, 0.8)
  }

  const handleReset = () => {
    d3.select(svgRef.current).transition().call(d3.zoom().transform, d3.zoomIdentity)
  }

  const saveView = () => {
    return {
      filterSettings,
      layoutSettings,
      visibilitySettings,
      opacitySettings,
      selectedNode,
    }
  }

  const shareView = () => {
    const viewData = saveView()
    const url = `${window.location.origin}?view=${encodeURIComponent(JSON.stringify(viewData))}`
    return url
  }

  const exportGraph = (format) => {
    const svgElement = d3.select(svgRef.current).select("svg").node()
    if (!svgElement) return

    const serializer = new XMLSerializer()
    let source = serializer.serializeToString(svgElement)

    // Add namespace if not present
    if (!source.match(/^<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"')
    }

    // Add DOCTYPE if needed
    if (format === "svg" && !source.match(/^<\?xml/)) {
      source = '<?xml version="1.0" standalone="no"?>\r\n' + source
    }

    const blob = new Blob([source], { type: format === "svg" ? "image/svg+xml" : "image/png" })
    const url = URL.createObjectURL(blob)

    const downloadLink = document.createElement("a")
    downloadLink.href = url
    downloadLink.download = `dependency-graph.${format}`
    document.body.appendChild(downloadLink)
    downloadLink.click()
    document.body.removeChild(downloadLink)

    URL.revokeObjectURL(url)
  }

  const resetView = () => {
    svgTransformRef.current = d3.zoomIdentity
    d3.select(svgRef.current).select("svg").transition().call(d3.zoom().transform, d3.zoomIdentity)
  }

  const loadSavedView = () => {
    return saveView()
  }

  React.useImperativeHandle(ref, () => ({
    saveView: saveView,
    shareView: shareView,
    exportGraph: exportGraph,
    resetView: resetView,
    loadSavedView: loadSavedView,
  }))

  return (
    <div ref={containerRef} className="w-full h-full">
      <svg ref={svgRef} className="w-full h-full"></svg>
    </div>
  )
}

export const HighlyInteractiveGraph = React.forwardRef(HighlyInteractiveGraph)
