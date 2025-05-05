"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export function SearchNodes() {
  const [searchQuery, setSearchQuery] = useState("")

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Search nodes</label>
      <div className="flex gap-2">
        <Input
          placeholder="Search component..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1"
        />
        <Button size="sm">Search</Button>
      </div>
    </div>
  )
}
