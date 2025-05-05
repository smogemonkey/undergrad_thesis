"use client"

import { useState } from "react"
import { ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"

export function InteractiveLegend({ onVisibilityChange, onOpacityChange }) {
  const [isOpen, setIsOpen] = useState(true)
  const [visibility, setVisibility] = useState({
    critical: true,
    high: true,
    medium: true,
    low: true,
    safe: true,
  })
  const [opacity, setOpacity] = useState({
    critical: 100,
    high: 100,
    medium: 100,
    low: 100,
    safe: 100,
  })

  const toggleVisibility = (risk) => {
    const newVisibility = {
      ...visibility,
      [risk]: !visibility[risk],
    }
    setVisibility(newVisibility)
    onVisibilityChange?.(newVisibility)
  }

  const handleOpacityChange = (risk, value) => {
    const newOpacity = {
      ...opacity,
      [risk]: value[0],
    }
    setOpacity(newOpacity)
    onOpacityChange?.(newOpacity)
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <button
        className="flex items-center justify-between w-full p-4 font-medium text-left bg-gray-50 border-b"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center">
          <div className="bg-gray-200 p-1.5 rounded-lg mr-2">
            {isOpen ? <Eye className="h-4 w-4 text-gray-700" /> : <EyeOff className="h-4 w-4 text-gray-700" />}
          </div>
          Legend & Visibility
        </div>
        {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </button>

      {isOpen && (
        <div className="px-4 pb-4 space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-600"></div>
              <span className="text-sm">Critical risk</span>
              <Badge className="ml-1 bg-red-600">CVSS 9.0-10.0</Badge>
            </div>
            <Switch checked={visibility.critical} onCheckedChange={() => toggleVisibility("critical")} />
          </div>
          {visibility.critical && (
            <div className="pl-5 pr-2">
              <Slider
                value={[opacity.critical]}
                max={100}
                step={1}
                onValueChange={(value) => handleOpacityChange("critical", value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span className="text-sm">High risk</span>
              <Badge className="ml-1 bg-red-500">CVSS 7.0-8.9</Badge>
            </div>
            <Switch checked={visibility.high} onCheckedChange={() => toggleVisibility("high")} />
          </div>
          {visibility.high && (
            <div className="pl-5 pr-2">
              <Slider
                value={[opacity.high]}
                max={100}
                step={1}
                onValueChange={(value) => handleOpacityChange("high", value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-orange-500"></div>
              <span className="text-sm">Medium risk</span>
              <Badge className="ml-1 bg-orange-500">CVSS 4.0-6.9</Badge>
            </div>
            <Switch checked={visibility.medium} onCheckedChange={() => toggleVisibility("medium")} />
          </div>
          {visibility.medium && (
            <div className="pl-5 pr-2">
              <Slider
                value={[opacity.medium]}
                max={100}
                step={1}
                onValueChange={(value) => handleOpacityChange("medium", value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <span className="text-sm">Low risk</span>
              <Badge className="ml-1 bg-yellow-500">CVSS 0.1-3.9</Badge>
            </div>
            <Switch checked={visibility.low} onCheckedChange={() => toggleVisibility("low")} />
          </div>
          {visibility.low && (
            <div className="pl-5 pr-2">
              <Slider
                value={[opacity.low]}
                max={100}
                step={1}
                onValueChange={(value) => handleOpacityChange("low", value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm">Safe component</span>
              <Badge className="ml-1 bg-blue-500">No vulnerabilities</Badge>
            </div>
            <Switch checked={visibility.safe} onCheckedChange={() => toggleVisibility("safe")} />
          </div>
          {visibility.safe && (
            <div className="pl-5 pr-2">
              <Slider
                value={[opacity.safe]}
                max={100}
                step={1}
                onValueChange={(value) => handleOpacityChange("safe", value)}
              />
            </div>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-black"></div>
              <span className="text-sm">Selected component</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
