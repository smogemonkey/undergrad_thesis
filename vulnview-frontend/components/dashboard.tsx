import { InteractiveDashboard } from "@/components/interactive-dashboard"
import { ComponentSummary } from "@/components/component-summary"
import { UploadHelpSection } from "@/components/upload-help-section"

export function Dashboard() {
  return (
    <div className="flex flex-1 flex-col p-4 bg-gray-50 space-y-6">
      <ComponentSummary />
      <UploadHelpSection />
      <InteractiveDashboard />
    </div>
  )
}
