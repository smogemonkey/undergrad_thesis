"use client"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { Save, Share2, Download, Copy, Check, X } from "lucide-react"

export function GraphActionsManager({
  onSaveView,
  onShareView,
  onExportGraph,
  savedViews = [],
  onLoadView,
  onCreateView,
}) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [shareDialogOpen, setShareDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [viewName, setViewName] = useState("")
  const [viewDescription, setViewDescription] = useState("")
  const [exportFormat, setExportFormat] = useState("png")
  const [exportResolution, setExportResolution] = useState("2x")
  const [shareableUrl, setShareableUrl] = useState("")
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()
  const urlInputRef = useRef(null)

  // Handle save view
  const handleSaveView = () => {
    if (!viewName.trim()) {
      toast({
        title: "Name required",
        description: "Please provide a name for this view.",
        variant: "destructive",
      })
      return
    }

    onCreateView?.({
      name: viewName,
      description: viewDescription,
      timestamp: new Date().toISOString(),
    })

    onSaveView?.()
    setSaveDialogOpen(false)
    setViewName("")
    setViewDescription("")

    toast({
      title: "View saved",
      description: "Your graph view has been saved successfully.",
    })
  }

  // Handle share view
  const handleShareView = () => {
    const url = onShareView?.() || window.location.href
    setShareableUrl(url)
    setShareDialogOpen(true)
  }

  // Handle copy to clipboard
  const handleCopyToClipboard = () => {
    if (urlInputRef.current) {
      urlInputRef.current.select()
      document.execCommand("copy")
      setCopied(true)

      toast({
        title: "Link copied",
        description: "Shareable link has been copied to clipboard.",
      })

      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Handle export graph
  const handleExportGraph = () => {
    onExportGraph?.(exportFormat, exportResolution)
    setExportDialogOpen(false)

    toast({
      title: "Export complete",
      description: `Graph has been exported as ${exportFormat.toUpperCase()}.`,
    })
  }

  return (
    <>
      {/* Save View Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" onClick={() => setSaveDialogOpen(true)}>
            <Save className="h-4 w-4 mr-2" />
            Save View
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Current View</DialogTitle>
            <DialogDescription>Save the current graph view for future reference or sharing.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="view-name" className="text-right">
                Name
              </Label>
              <Input
                id="view-name"
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="My Graph View"
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="view-description" className="text-right">
                Description
              </Label>
              <Input
                id="view-description"
                value={viewDescription}
                onChange={(e) => setViewDescription(e.target.value)}
                placeholder="Optional description"
                className="col-span-3"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveView}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share View Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" onClick={handleShareView}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Graph View</DialogTitle>
            <DialogDescription>Share this link to show others your current graph view.</DialogDescription>
          </DialogHeader>

          <div className="flex items-center space-x-2 mt-4">
            <Input ref={urlInputRef} value={shareableUrl} readOnly className="flex-1" />
            <Button size="icon" onClick={handleCopyToClipboard}>
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <DialogFooter className="mt-4">
            <Button onClick={() => setShareDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Graph Dialog */}
      <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full" onClick={() => setExportDialogOpen(true)}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Export Graph</DialogTitle>
            <DialogDescription>Export the current graph view as an image or vector file.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="export-format" className="text-right">
                Format
              </Label>
              <RadioGroup
                id="export-format"
                value={exportFormat}
                onValueChange={setExportFormat}
                className="col-span-3 flex space-x-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="png" id="png" />
                  <Label htmlFor="png">PNG</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="svg" id="svg" />
                  <Label htmlFor="svg">SVG</Label>
                </div>
              </RadioGroup>
            </div>

            {exportFormat === "png" && (
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="export-resolution" className="text-right">
                  Resolution
                </Label>
                <Select value={exportResolution} onValueChange={setExportResolution}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select resolution" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1x">1x (Standard)</SelectItem>
                    <SelectItem value="2x">2x (High Resolution)</SelectItem>
                    <SelectItem value="4x">4x (Ultra HD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportGraph}>Export</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Saved Views Manager */}
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full mt-2">
            Load Saved View
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Saved Views</DialogTitle>
            <DialogDescription>Load a previously saved graph view.</DialogDescription>
          </DialogHeader>

          <div className="max-h-[300px] overflow-y-auto mt-4">
            {savedViews.length > 0 ? (
              <div className="space-y-2">
                {savedViews.map((view, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-md">
                    <div>
                      <h4 className="font-medium">{view.name}</h4>
                      {view.description && <p className="text-sm text-gray-500">{view.description}</p>}
                      <p className="text-xs text-gray-400">{new Date(view.timestamp).toLocaleString()}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => onLoadView?.(view)}>
                        Load
                      </Button>
                      <Button size="icon" variant="outline">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Save className="h-10 w-10 mx-auto mb-2 opacity-20" />
                <p>No saved views yet</p>
                <p className="text-sm">Save your current view to access it later</p>
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button variant="outline">Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
