"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  ChevronDown,
  Upload,
  LogOut,
  Settings,
  UserCircle,
  Shield,
  BarChart3,
  GitCompare,
  FileText,
} from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { CompareBuildDialog } from "@/components/compare-builds-dialog"
import { GenerateReportDialog } from "@/components/generate-report-dialog"
import { ExportDataDialog } from "@/components/export-data-dialog"
import { UploadSbomDialog } from "@/components/upload-sbom-dialog"

export function Navbar() {
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)

  const handleLogout = () => {
    // Handle logout logic here
    console.log("Logging out...")
  }

  return (
    <nav className="bg-[#f0f4f8] border-b border-[#e1e8f0] shadow-sm">
      <div className="container mx-auto flex justify-between items-center py-3 px-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="bg-[#e1e8f0] rounded-md p-1.5">
            <Shield className="h-5 w-5 text-[#5a6b7b]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#2d3748]">VulnView</span>
        </Link>

        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            className="text-[#5a6b7b] hover:text-[#2d3748] hover:bg-[#e1e8f0] flex items-center gap-2"
            onClick={() => setUploadDialogOpen(true)}
          >
            <Upload className="h-4 w-4" />
            Upload
          </Button>

          <Button
            variant="ghost"
            className="text-[#5a6b7b] hover:text-[#2d3748] hover:bg-[#e1e8f0] flex items-center gap-2"
            asChild
          >
            <Link href="/components">
              <BarChart3 className="h-4 w-4" />
              Components
            </Link>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-[#5a6b7b] hover:text-[#2d3748] hover:bg-[#e1e8f0] flex items-center gap-2"
              >
                Actions
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border">
              <DropdownMenuItem
                onClick={() => setCompareDialogOpen(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <GitCompare className="h-4 w-4 text-[#5a6b7b]" />
                <span>Compare Builds</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setReportDialogOpen(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-[#5a6b7b]" />
                <span>Generate Report</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setExportDialogOpen(true)}
                className="flex items-center gap-2 cursor-pointer"
              >
                <FileText className="h-4 w-4 text-[#5a6b7b]" />
                <span>Export Data</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="p-1 rounded-full">
                <Avatar className="h-8 w-8 border-2 border-[#e1e8f0]">
                  <AvatarImage src="/placeholder.svg?height=32&width=32" alt="Profile" />
                  <AvatarFallback className="bg-[#e1e8f0] text-[#5a6b7b]">JD</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white border">
              <DropdownMenuItem asChild>
                <Link href="/profile" className="flex items-center gap-2">
                  <UserCircle className="h-4 w-4 text-[#5a6b7b]" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/profile?tab=settings" className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-[#5a6b7b]" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 text-red-600">
                <LogOut className="h-4 w-4 text-red-600" />
                <span>Logout</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {/* Dialogs */}
      <CompareBuildDialog open={compareDialogOpen} onOpenChange={setCompareDialogOpen} />
      <GenerateReportDialog open={reportDialogOpen} onOpenChange={setReportDialogOpen} />
      <ExportDataDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
      <UploadSbomDialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen} />
    </nav>
  )
}
