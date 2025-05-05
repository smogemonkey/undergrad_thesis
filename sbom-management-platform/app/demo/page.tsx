import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { InteractiveDashboard } from "@/components/interactive-dashboard"

export default function DemoPage() {
  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <div className="container mx-auto py-6 space-y-6">
        <h1 className="text-2xl font-bold">Interactive Dependency Graph Demo</h1>

        <InteractiveDashboard />

        <Card>
          <CardHeader>
            <CardTitle>How to Use the Interactive Graph</CardTitle>
            <CardDescription>Tips for navigating and exploring the dependency visualization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Navigation</h3>
              <ul className="list-disc pl-5 mt-2">
                <li>Use the mouse wheel or zoom buttons to zoom in and out</li>
                <li>Click and drag to pan around the visualization</li>
                <li>Click on a node to select it and view its details</li>
                <li>Hover over nodes to highlight their connections</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium">Advanced Features</h3>
              <ul className="list-disc pl-5 mt-2">
                <li>Use the filter controls to show only specific risk levels</li>
                <li>Change the layout type to view dependencies in different arrangements</li>
                <li>Group nodes by risk level or other attributes</li>
                <li>Save and share your current view with others</li>
                <li>Export the graph as PNG or SVG for reports</li>
                <li>Use the timeline slider to see how dependencies change over time</li>
              </ul>
            </div>

            <div>
              <h3 className="font-medium">Node Details</h3>
              <ul className="list-disc pl-5 mt-2">
                <li>Click "Focus" to center and zoom on a selected node</li>
                <li>Use "Highlight Path" to see connections between components</li>
                <li>View detailed vulnerability information in the node details panel</li>
                <li>Explore dependencies and dependents of any selected component</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
