"use client"

import { useState } from "react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function ProjectSelector() {
  const [project, setProject] = useState("jenkins-v2.387.3")

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium">Select project</label>
      <Select value={project} onValueChange={setProject}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a project" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="jenkins-v2.387.3">Jenkins v2.387.3</SelectItem>
          <SelectItem value="spring-boot-2.7.0">Spring Boot 2.7.0</SelectItem>
          <SelectItem value="kubernetes-1.26">Kubernetes 1.26</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
