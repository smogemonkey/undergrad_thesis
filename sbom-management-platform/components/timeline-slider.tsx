"use client"

import { useState } from "react"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, Pause, SkipBack, SkipForward, Calendar } from "lucide-react"

export function TimelineSlider({ onTimelineChange }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0)

  // Example timeline data
  const timelineData = [
    { date: "2023-01-15", label: "v1.0.0", vulnerabilities: 0 },
    { date: "2023-02-28", label: "v1.1.0", vulnerabilities: 1 },
    { date: "2023-04-10", label: "v1.2.0", vulnerabilities: 3 },
    { date: "2023-05-22", label: "v1.3.0", vulnerabilities: 2 },
    { date: "2023-07-05", label: "v1.4.0", vulnerabilities: 0 },
    { date: "2023-08-18", label: "v2.0.0", vulnerabilities: 5 },
    { date: "2023-10-01", label: "v2.1.0", vulnerabilities: 2 },
    { date: "2023-11-15", label: "v2.2.0", vulnerabilities: 1 },
    { date: "2024-01-10", label: "v2.3.0", vulnerabilities: 0 },
  ]

  const handleTimelineChange = (value) => {
    const newIndex = value[0]
    setCurrentTimeIndex(newIndex)
    onTimelineChange?.(timelineData[newIndex])
  }

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying)
    // Logic for auto-advancing would go here
  }

  const handlePrevious = () => {
    if (currentTimeIndex > 0) {
      const newIndex = currentTimeIndex - 1
      setCurrentTimeIndex(newIndex)
      onTimelineChange?.(timelineData[newIndex])
    }
  }

  const handleNext = () => {
    if (currentTimeIndex < timelineData.length - 1) {
      const newIndex = currentTimeIndex + 1
      setCurrentTimeIndex(newIndex)
      onTimelineChange?.(timelineData[newIndex])
    }
  }

  return (
    <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
      <div className="p-4 bg-gray-50 border-b">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <div className="bg-gray-200 p-1.5 rounded-lg">
              <Calendar className="h-4 w-4 text-gray-700" />
            </div>
            Dependency Timeline
          </h3>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-gray-700" />
            <span className="text-xs text-gray-700">{timelineData[currentTimeIndex].date}</span>
          </div>
        </div>
      </div>

      <div className="p-4">
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              {timelineData[0].date}
            </Badge>
            <Badge variant="outline" className="border-gray-300 text-gray-700">
              {timelineData[timelineData.length - 1].date}
            </Badge>
          </div>
          <Slider
            value={[currentTimeIndex]}
            max={timelineData.length - 1}
            step={1}
            onValueChange={handleTimelineChange}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Badge className="bg-gray-700 text-white shadow-sm">{timelineData[currentTimeIndex].label}</Badge>
            {timelineData[currentTimeIndex].vulnerabilities > 0 && (
              <Badge className="bg-red-500 shadow-sm">
                {timelineData[currentTimeIndex].vulnerabilities} vulnerabilities
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={handlePrevious}
              disabled={currentTimeIndex === 0}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={togglePlayPause}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleNext}
              disabled={currentTimeIndex === timelineData.length - 1}
              className="border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
