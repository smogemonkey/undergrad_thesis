"use client"

import { useState } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import {
  Mail,
  Building,
  MapPin,
  Calendar,
  Shield,
  Key,
  Lock,
  LogOut,
  Activity,
  FileText,
  BarChart2,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Edit,
  Save,
  ChevronRight,
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [isEditing, setIsEditing] = useState(false)
  const { toast } = useToast()

  const handleSaveProfile = () => {
    setIsEditing(false)
    toast({
      title: "Profile updated",
      description: "Your profile information has been saved successfully.",
    })
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#f8f9fa]">
      <Navbar />

      <div className="container mx-auto py-6 px-4 md:px-6 space-y-8">
        {/* Profile Header */}
        <div className="flex flex-col md:flex-row gap-6 items-start">
          <div className="relative">
            <Avatar className="h-24 w-24 border-4 border-white shadow-md">
              <AvatarImage src="/placeholder.svg?height=96&width=96" alt="Profile" />
              <AvatarFallback className="text-2xl bg-[#6c757d] text-white">JD</AvatarFallback>
            </Avatar>
            {isEditing && (
              <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 rounded-full bg-white">
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#212529]">Jane Doe</h1>
                <p className="text-[#6c757d] flex items-center gap-1">
                  <Shield className="h-4 w-4" />
                  Security Engineer
                </p>
              </div>

              <div className="flex gap-3">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleSaveProfile} className="bg-[#0d6efd] hover:bg-[#0b5ed7]">
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </>
                ) : (
                  <Button onClick={() => setIsEditing(true)} className="bg-[#0d6efd] hover:bg-[#0b5ed7]">
                    <Edit className="mr-2 h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Badge variant="outline" className="flex items-center gap-1 text-[#495057] border-[#ced4da]">
                <Mail className="h-3 w-3" />
                jane.doe@example.com
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-[#495057] border-[#ced4da]">
                <Building className="h-3 w-3" />
                Acme Corporation
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-[#495057] border-[#ced4da]">
                <MapPin className="h-3 w-3" />
                San Francisco, CA
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1 text-[#495057] border-[#ced4da]">
                <Calendar className="h-3 w-3" />
                Joined Jan 2023
              </Badge>
            </div>
          </div>
        </div>

        {/* Profile Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="sticky top-0 z-10 bg-[#f8f9fa] pt-2 pb-4">
            <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full bg-[#e9ecef]">
              <TabsTrigger value="overview" className="data-[state=active]:bg-[#0d6efd] data-[state=active]:text-white">
                Overview
              </TabsTrigger>
              <TabsTrigger value="activity" className="data-[state=active]:bg-[#0d6efd] data-[state=active]:text-white">
                Activity
              </TabsTrigger>
              <TabsTrigger value="projects" className="data-[state=active]:bg-[#0d6efd] data-[state=active]:text-white">
                Projects
              </TabsTrigger>
              <TabsTrigger value="settings" className="data-[state=active]:bg-[#0d6efd] data-[state=active]:text-white">
                Settings
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* About Section */}
              <Card className="md:col-span-2 border-[#dee2e6]">
                <CardHeader className="bg-[#f8f9fa] border-b border-[#dee2e6]">
                  <CardTitle className="text-[#212529]">About</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {isEditing ? (
                    <Textarea
                      className="min-h-[120px] border-[#ced4da]"
                      defaultValue="Security engineer with over 5 years of experience in vulnerability management and software supply chain security. Specializing in SBOM analysis, dependency tracking, and security automation."
                    />
                  ) : (
                    <p className="text-[#212529]">
                      Security engineer with over 5 years of experience in vulnerability management and software supply
                      chain security. Specializing in SBOM analysis, dependency tracking, and security automation.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Stats Card */}
              <Card className="border-[#dee2e6]">
                <CardHeader className="bg-[#f8f9fa] border-b border-[#dee2e6]">
                  <CardTitle className="text-[#212529]">Statistics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#495057]">Projects Analyzed</span>
                      <span className="font-medium text-[#212529]">24</span>
                    </div>
                    <Progress value={80} className="h-2" indicatorClassName="bg-[#0d6efd]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#495057]">Vulnerabilities Found</span>
                      <span className="font-medium text-[#212529]">137</span>
                    </div>
                    <Progress value={65} className="h-2" indicatorClassName="bg-[#dc3545]" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-[#495057]">Issues Resolved</span>
                      <span className="font-medium text-[#212529]">98</span>
                    </div>
                    <Progress value={72} className="h-2" indicatorClassName="bg-[#198754]" />
                  </div>
                </CardContent>
              </Card>

              {/* Skills Section */}
              <Card className="border-[#dee2e6]">
                <CardHeader className="bg-[#f8f9fa] border-b border-[#dee2e6]">
                  <CardTitle className="text-[#212529]">Skills & Expertise</CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge className="bg-[#0d6efd]">Vulnerability Management</Badge>
                    <Badge className="bg-[#6610f2]">SBOM Analysis</Badge>
                    <Badge className="bg-[#0dcaf0] text-[#212529]">Supply Chain Security</Badge>
                    <Badge className="bg-[#198754]">Risk Assessment</Badge>
                    <Badge className="bg-[#6f42c1]">Dependency Tracking</Badge>
                    <Badge className="bg-[#fd7e14]">Security Automation</Badge>
                    <Badge className="bg-[#20c997]">Compliance</Badge>
                    <Badge className="bg-[#d63384]">OWASP</Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card className="md:col-span-2 border-[#dee2e6]">
                <CardHeader className="flex flex-row items-center justify-between bg-[#f8f9fa] border-b border-[#dee2e6]">
                  <CardTitle className="text-[#212529]">Recent Activity</CardTitle>
                  <Button variant="ghost" size="sm" className="gap-1 text-[#0d6efd]">
                    View All <ChevronRight className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <div className="mt-0.5">
                        <div className="bg-[#cfe2ff] p-2 rounded-full">
                          <FileText className="h-4 w-4 text-[#0d6efd]" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-[#212529]">Generated vulnerability report</p>
                        <p className="text-sm text-[#6c757d]">Generated a comprehensive report for Project Alpha</p>
                        <p className="text-xs text-[#adb5bd] mt-1">2 hours ago</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="mt-0.5">
                        <div className="bg-[#d1e7dd] p-2 rounded-full">
                          <CheckCircle2 className="h-4 w-4 text-[#198754]" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-[#212529]">Resolved critical vulnerability</p>
                        <p className="text-sm text-[#6c757d]">Fixed CVE-2023-1234 in Project Beta</p>
                        <p className="text-xs text-[#adb5bd] mt-1">Yesterday</p>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <div className="mt-0.5">
                        <div className="bg-[#fff3cd] p-2 rounded-full">
                          <AlertTriangle className="h-4 w-4 text-[#ffc107]" />
                        </div>
                      </div>
                      <div>
                        <p className="font-medium text-[#212529]">Identified new vulnerability</p>
                        <p className="text-sm text-[#6c757d]">Found CVE-2023-5678 in Project Gamma</p>
                        <p className="text-xs text-[#adb5bd] mt-1">2 days ago</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="space-y-6">
            <Card className="border-[#dee2e6]">
              <CardHeader className="bg-[#f8f9fa] border-b border-[#dee2e6]">
                <CardTitle className="text-[#212529]">Activity Timeline</CardTitle>
                <CardDescription className="text-[#6c757d]">Your recent actions and notifications</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="space-y-8">
                  <div className="relative pl-8 pb-8 border-l border-[#dee2e6]">
                    <div className="absolute -left-2 top-0 bg-[#0d6efd] rounded-full w-4 h-4"></div>
                    <div className="mb-1">
                      <span className="text-sm text-[#6c757d]">Today, 10:30 AM</span>
                    </div>
                    <h3 className="text-base font-medium text-[#212529]">Generated vulnerability report</h3>
                    <p className="text-[#495057] mt-1">
                      Created a comprehensive vulnerability report for Project Alpha, identifying 3 critical and 5
                      high-severity issues.
                    </p>
                  </div>

                  <div className="relative pl-8 pb-8 border-l border-[#dee2e6]">
                    <div className="absolute -left-2 top-0 bg-[#198754] rounded-full w-4 h-4"></div>
                    <div className="mb-1">
                      <span className="text-sm text-[#6c757d]">Yesterday, 2:15 PM</span>
                    </div>
                    <h3 className="text-base font-medium text-[#212529]">Resolved critical vulnerability</h3>
                    <p className="text-[#495057] mt-1">
                      Fixed CVE-2023-1234 in Project Beta by updating the affected dependency to the latest version.
                    </p>
                  </div>

                  <div className="relative pl-8 pb-8 border-l border-[#dee2e6]">
                    <div className="absolute -left-2 top-0 bg-[#fd7e14] rounded-full w-4 h-4"></div>
                    <div className="mb-1">
                      <span className="text-sm text-[#6c757d]">May 15, 2023, 11:45 AM</span>
                    </div>
                    <h3 className="text-base font-medium text-[#212529]">Identified new vulnerability</h3>
                    <p className="text-[#495057] mt-1">
                      Discovered CVE-2023-5678 affecting a critical component in Project Gamma. Assigned to the
                      development team for remediation.
                    </p>
                  </div>

                  <div className="relative pl-8">
                    <div className="absolute -left-2 top-0 bg-[#6f42c1] rounded-full w-4 h-4"></div>
                    <div className="mb-1">
                      <span className="text-sm text-[#6c757d]">May 10, 2023, 9:20 AM</span>
                    </div>
                    <h3 className="text-base font-medium text-[#212529]">Completed security assessment</h3>
                    <p className="text-[#495057] mt-1">
                      Finished comprehensive security assessment for Project Delta, providing recommendations for
                      improving the security posture.
                    </p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-[#f8f9fa] border-t border-[#dee2e6]">
                <Button variant="outline" className="w-full border-[#ced4da] text-[#495057]">
                  Load More
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          {/* Projects Tab */}
          <TabsContent value="projects" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="border-[#dee2e6]">
                <CardHeader className="pb-2 bg-[#f8f9fa] border-b border-[#dee2e6]">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-[#212529]">Project Alpha</CardTitle>
                    <Badge className="bg-[#0d6efd]">Active</Badge>
                  </div>
                  <CardDescription className="text-[#6c757d]">Web application framework</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#495057]">Components</span>
                      <span className="text-[#212529]">124</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#495057]">Vulnerabilities</span>
                      <span className="text-[#dc3545] font-medium">8</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <AlertCircle className="h-4 w-4 text-[#dc3545]" />
                      <span className="text-sm text-[#dc3545]">3 critical issues need attention</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-[#f8f9fa] border-t border-[#dee2e6]">
                  <Button variant="outline" className="w-full border-[#ced4da] text-[#495057]">
                    View Project
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-[#dee2e6]">
                <CardHeader className="pb-2 bg-[#f8f9fa] border-b border-[#dee2e6]">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-[#212529]">Project Beta</CardTitle>
                    <Badge variant="outline" className="border-[#ced4da] text-[#495057]">
                      Completed
                    </Badge>
                  </div>
                  <CardDescription className="text-[#6c757d]">Mobile application backend</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#495057]">Components</span>
                      <span className="text-[#212529]">87</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#495057]">Vulnerabilities</span>
                      <span className="text-[#198754] font-medium">0</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <CheckCircle2 className="h-4 w-4 text-[#198754]" />
                      <span className="text-sm text-[#198754]">All issues resolved</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-[#f8f9fa] border-t border-[#dee2e6]">
                  <Button variant="outline" className="w-full border-[#ced4da] text-[#495057]">
                    View Project
                  </Button>
                </CardFooter>
              </Card>

              <Card className="border-[#dee2e6]">
                <CardHeader className="pb-2 bg-[#f8f9fa] border-b border-[#dee2e6]">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-[#212529]">Project Gamma</CardTitle>
                    <Badge className="bg-[#fd7e14]">In Progress</Badge>
                  </div>
                  <CardDescription className="text-[#6c757d]">Data processing pipeline</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-[#495057]">Components</span>
                      <span className="text-[#212529]">156</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-[#495057]">Vulnerabilities</span>
                      <span className="text-[#fd7e14] font-medium">12</span>
                    </div>
                    <div className="flex items-center gap-2 mt-4">
                      <Clock className="h-4 w-4 text-[#fd7e14]" />
                      <span className="text-sm text-[#fd7e14]">7 issues being addressed</span>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="bg-[#f8f9fa] border-t border-[#dee2e6]">
                  <Button variant="outline" className="w-full border-[#ced4da] text-[#495057]">
                    View Project
                  </Button>
                </CardFooter>
              </Card>
            </div>

            <Card className="border-[#dee2e6]">
              <CardHeader className="bg-[#f8f9fa] border-b border-[#dee2e6]">
                <CardTitle className="text-[#212529]">Project Analytics</CardTitle>
                <CardDescription className="text-[#6c757d]">Overview of your project security metrics</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="h-[300px] flex items-center justify-center bg-[#f8f9fa] rounded-md border border-dashed border-[#ced4da]">
                  <div className="text-center">
                    <BarChart2 className="h-12 w-12 mx-auto text-[#ced4da]" />
                    <p className="mt-2 text-[#6c757d]">Project analytics visualization would appear here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="border-[#dee2e6]">
              <CardHeader className="bg-[#f8f9fa] border-b border-[#dee2e6]">
                <CardTitle className="text-[#212529]">Account Settings</CardTitle>
                <CardDescription className="text-[#6c757d]">Manage your account preferences</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#212529]">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-[#495057]">
                        Full Name
                      </Label>
                      <Input id="fullName" defaultValue="Jane Doe" className="border-[#ced4da]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-[#495057]">
                        Email Address
                      </Label>
                      <Input id="email" type="email" defaultValue="jane.doe@example.com" className="border-[#ced4da]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="jobTitle" className="text-[#495057]">
                        Job Title
                      </Label>
                      <Input id="jobTitle" defaultValue="Security Engineer" className="border-[#ced4da]" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="company" className="text-[#495057]">
                        Company
                      </Label>
                      <Input id="company" defaultValue="Acme Corporation" className="border-[#ced4da]" />
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#dee2e6]" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#212529]">Notifications</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#212529]">Email Notifications</p>
                        <p className="text-sm text-[#6c757d]">Receive email updates about your projects</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#212529]">Security Alerts</p>
                        <p className="text-sm text-[#6c757d]">Get notified about critical vulnerabilities</p>
                      </div>
                      <Switch defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-[#212529]">Weekly Reports</p>
                        <p className="text-sm text-[#6c757d]">Receive weekly summary reports</p>
                      </div>
                      <Switch />
                    </div>
                  </div>
                </div>

                <Separator className="bg-[#dee2e6]" />

                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-[#212529]">Security</h3>
                  <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-start border-[#ced4da] text-[#495057]">
                      <Key className="mr-2 h-4 w-4" />
                      Change Password
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-[#ced4da] text-[#495057]">
                      <Lock className="mr-2 h-4 w-4" />
                      Two-Factor Authentication
                    </Button>
                    <Button variant="outline" className="w-full justify-start border-[#ced4da] text-[#495057]">
                      <Activity className="mr-2 h-4 w-4" />
                      Login Activity
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between bg-[#f8f9fa] border-t border-[#dee2e6]">
                <Button
                  variant="outline"
                  className="text-[#dc3545] hover:text-[#b02a37] hover:bg-[#f8d7da] border-[#ced4da]"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
                <Button className="bg-[#0d6efd] hover:bg-[#0b5ed7]">
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  )
}
