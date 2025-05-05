"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp } from "lucide-react"

export function Legend() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div>
      <button
        className="flex items-center justify-between w-full p-4 font-medium text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        Legend
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm">Safe component</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <span className="text-sm">Low risk (CVSS 0.1-3.9)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-500"></div>
            <span className="text-sm">Medium risk (CVSS 4.0-6.9)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="text-sm">High risk (CVSS 7.0-8.9)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-800"></div>
            <span className="text-sm">Critical risk (CVSS 9.0-10.0)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-black"></div>
            <span className="text-sm">Selected component</span>
          </div>
        </div>
      )}
    </div>
  )
}
