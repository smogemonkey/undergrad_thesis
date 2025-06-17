"use client"

import { useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ChevronDown, Upload, User, LogOut, LayoutDashboard, FileTextIcon, GitCompareIcon, DatabaseIcon, InfoIcon, SettingsIcon, ShieldCheckIcon, Sparkles } from "lucide-react"
import { CompareBuildDialog } from "@/components/compare-builds-dialog"
import { GenerateReportDialog } from "@/components/generate-report-dialog"
import { ExportDataDialog } from "@/components/export-data-dialog"
import { UploadSbomDialog } from "@/components/upload-sbom-dialog"
import NotificationCenter from "@/components/notification-center"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"

export function Navbar() {
  const [compareDialogOpen, setCompareDialogOpen] = useState(false)
  const [reportDialogOpen, setReportDialogOpen] = useState(false)
  const [exportDialogOpen, setExportDialogOpen] = useState(false)
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const { isAuthenticated, user, logout, isLoading: authIsLoading } = useAuth()
  const router = useRouter()

  const handleLogout = () => {
    logout()
  }

  if (authIsLoading) {
    return (
      <nav className="bg-gray-900 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center">
            <ShieldCheckIcon className="mr-2 h-6 w-6" />VulnView
          </Link>
          <div className="text-sm">Loading user...</div>
        </div>
      </nav>
    )
  }

  return (
    <>
      <nav className="bg-gray-900 text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <Link href="/" className="text-xl font-bold flex items-center">
            <ShieldCheckIcon className="mr-2 h-6 w-6" />VulnView
          </Link>
          <div className="flex items-center gap-1 md:gap-2">
            <Button variant="ghost" className="text-white hover:bg-gray-700 px-3 py-2 text-sm hidden sm:inline-flex">
              <InfoIcon className="mr-1 md:mr-2 h-4 w-4" /> About
            </Button>
            {isAuthenticated ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="text-white hover:bg-gray-700 p-2 rounded-full">
                    <User className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-gray-800 text-white border-gray-700">
                  <DropdownMenuLabel className="font-normal">
                    Signed in as <span className="font-semibold">{user?.username || user?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-gray-700"/>
                  <DropdownMenuItem className="hover:bg-gray-700" onClick={() => router.push('/profile')}>
                    <User className="mr-2 h-4 w-4" /> Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem className="hover:bg-gray-700" onClick={() => router.push('/settings')}>
                    <SettingsIcon className="mr-2 h-4 w-4" /> Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-700"/>
                  <DropdownMenuItem className="hover:bg-gray-700 text-red-400 hover:text-red-300" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" /> Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : null}
          </div>
        </div>
      </nav>
    </>
  )
}
