"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { useRouter } from "next/navigation"
import { ArrowRight, GitCompare } from "lucide-react"

export function CompareBuildDialog({ open, onOpenChange }) {
  const [buildA, setBuildA] = useState("jenkins-v2.387.3")
  const [buildB, setBuildB] = useState("jenkins-v2.386.2")
  const router = useRouter()

  const handleCompare = () => {
    router.push(`/compare?buildA=${buildA}&buildB=${buildB}`)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <GitCompare className="mr-2 h-5 w-5" />
            Compare Builds
          </DialogTitle>
          <DialogDescription>Select two builds to compare their dependencies and vulnerabilities.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buildA" className="text-right">
              Build A
            </Label>
            <div className="col-span-3">
              <Select value={buildA} onValueChange={setBuildA}>
                <SelectTrigger id="buildA">
                  <SelectValue placeholder="Select build" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jenkins-v2.387.3">Jenkins v2.387.3 (Latest)</SelectItem>
                  <SelectItem value="jenkins-v2.386.2">Jenkins v2.386.2</SelectItem>
                  <SelectItem value="jenkins-v2.385.1">Jenkins v2.385.1</SelectItem>
                  <SelectItem value="spring-boot-2.7.0">Spring Boot 2.7.0</SelectItem>
                  <SelectItem value="kubernetes-1.26">Kubernetes 1.26</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="buildB" className="text-right">
              Build B
            </Label>
            <div className="col-span-3">
              <Select value={buildB} onValueChange={setBuildB}>
                <SelectTrigger id="buildB">
                  <SelectValue placeholder="Select build" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="jenkins-v2.387.3">Jenkins v2.387.3 (Latest)</SelectItem>
                  <SelectItem value="jenkins-v2.386.2">Jenkins v2.386.2</SelectItem>
                  <SelectItem value="jenkins-v2.385.1">Jenkins v2.385.1</SelectItem>
                  <SelectItem value="spring-boot-2.7.0">Spring Boot 2.7.0</SelectItem>
                  <SelectItem value="kubernetes-1.26">Kubernetes 1.26</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-center">
            <ArrowRight className="h-8 w-8 text-gray-700" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-md p-3">
              <h4 className="font-medium text-sm text-gray-800">Build A</h4>
              <p className="text-xs text-gray-700 mt-1">
                {buildA === "jenkins-v2.387.3" && "109 components, 11 vulnerable"}
                {buildA === "jenkins-v2.386.2" && "107 components, 12 vulnerable"}
                {buildA === "jenkins-v2.385.1" && "105 components, 9 vulnerable"}
                {buildA === "spring-boot-2.7.0" && "87 components, 5 vulnerable"}
                {buildA === "kubernetes-1.26" && "132 components, 8 vulnerable"}
              </p>
            </div>
            <div className="border rounded-md p-3">
              <h4 className="font-medium text-sm text-gray-800">Build B</h4>
              <p className="text-xs text-gray-700 mt-1">
                {buildB === "jenkins-v2.387.3" && "109 components, 11 vulnerable"}
                {buildB === "jenkins-v2.386.2" && "107 components, 12 vulnerable"}
                {buildB === "jenkins-v2.385.1" && "105 components, 9 vulnerable"}
                {buildB === "spring-boot-2.7.0" && "87 components, 5 vulnerable"}
                {buildB === "kubernetes-1.26" && "132 components, 8 vulnerable"}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleCompare}>Compare Builds</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
