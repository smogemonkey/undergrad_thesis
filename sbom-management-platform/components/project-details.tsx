"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export function ProjectDetails() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div>
      <button
        className="flex items-center justify-between w-full p-4 font-medium text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        Project details
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-sm">Total components:</span>
            <span className="text-sm font-medium">109</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Vulnerable components:</span>
            <span className="text-sm font-medium text-red-600">11</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Vulnerabilities:</span>
            <span className="text-sm font-medium text-red-600">6</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Impact factor:</span>
            <span className="text-sm font-medium">10.0 %</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">Average CVSS score:</span>
            <span className="text-sm font-medium">8.0</span>
          </div>
        </div>
      )}
    </div>
  )
}
