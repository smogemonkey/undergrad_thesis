import { InteractiveDashboard } from "@/components/interactive-dashboard"
import { ComponentSummary } from "@/components/component-summary"
import { UploadHelpSection } from "@/components/upload-help-section"

export function Dashboard() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Upload Help Section - Moved to top */}
      <UploadHelpSection />

      {/* Component Summary */}
      <ComponentSummary />

      {/* Interactive Graph */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Interactive Dependency Graph</h2>
        <div className="h-[700px]">
          <InteractiveDashboard />
        </div>
      </div>
    </div>
  )
}
