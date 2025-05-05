"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { ChevronDown, ChevronUp } from "lucide-react"

export function GraphControls() {
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div>
      <button
        className="flex items-center justify-between w-full p-4 font-medium text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        Graph controls
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>
      {isOpen && (
        <div className="px-4 pb-4 space-y-4">
          <div className="space-y-2">
            <label className="text-sm">Node size</label>
            <Slider defaultValue={[50]} max={100} step={1} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Link distance</label>
            <Slider defaultValue={[70]} max={100} step={1} />
          </div>
          <div className="space-y-2">
            <label className="text-sm">Charge strength</label>
            <Slider defaultValue={[30]} max={100} step={1} />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm">Show labels</label>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm">Highlight vulnerabilities</label>
            <Switch defaultChecked />
          </div>
        </div>
      )}
    </div>
  )
}
