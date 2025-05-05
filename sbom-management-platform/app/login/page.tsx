"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Shield, EyeOff, Eye, Github, Mail, Lock, Sparkles } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const { login, isLoading } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      await login(email, password)
      toast({
        title: "Login successful",
        description: "Welcome back to VulnView!",
      })
    } catch (error) {
      toast({
        title: "Login failed",
        description: "Please check your credentials and try again.",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Left side - Illustration/Background */}
      <div className="hidden md:flex md:w-1/2 bg-gradient-to-br from-gradient-purple-from via-gradient-blue-from to-gradient-blue-to p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-mesh opacity-10 z-0"></div>
        <div className="absolute -bottom-48 -left-48 w-96 h-96 bg-gradient-to-br from-vibrant-pink to-vibrant-purple rounded-full opacity-20 blur-3xl"></div>
        <div className="absolute top-48 -right-48 w-96 h-96 bg-gradient-to-br from-vibrant-cyan to-vibrant-blue rounded-full opacity-20 blur-3xl"></div>

        <div className="relative z-10 flex flex-col justify-between h-full text-white">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <h1 className="text-4xl font-bold">VulnView</h1>
            </div>
            <p className="text-lg opacity-90 ml-1">Interactive SBOM Management Platform</p>
          </div>

          <div className="space-y-8">
            <div className="glass-effect rounded-xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-3 flex items-center gap-2 text-white">
                <Sparkles className="h-5 w-5 text-vibrant-yellow" />
                <span>Secure Your Software Supply Chain</span>
              </h3>
              <p className="text-white">
                Visualize dependencies, identify vulnerabilities, and mitigate risks in your software components.
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-vibrant-blue to-vibrant-cyan flex items-center justify-center">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-medium">Enterprise-Grade Security</h4>
                <p className="text-sm opacity-80">Protect your organization with advanced vulnerability management</p>
              </div>
            </div>
          </div>

          <div className="text-sm opacity-70">© 2024 VulnView. All rights reserved.</div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="flex-1 flex items-center justify-center p-6 bg-gradient-mesh">
        <div className="w-full max-w-md">
          <div className="text-center mb-8 md:hidden">
            <div className="inline-block p-3 rounded-full bg-gradient-to-r from-vibrant-purple to-vibrant-blue mb-4">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold gradient-text gradient-purple">VulnView</h1>
            <p className="text-gray-500">Interactive SBOM Management Platform</p>
          </div>

          <Tabs defaultValue="email" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-white/50 backdrop-blur-sm">
              <TabsTrigger
                value="email"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-vibrant-purple data-[state=active]:to-vibrant-blue data-[state=active]:text-white"
              >
                Email
              </TabsTrigger>
              <TabsTrigger
                value="sso"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-vibrant-purple data-[state=active]:to-vibrant-blue data-[state=active]:text-white"
              >
                SSO
              </TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl gradient-text gradient-purple">Sign In</CardTitle>
                  <CardDescription>Enter your credentials to access your account</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-gray-700">
                        Email
                      </Label>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Mail className="h-5 w-5 text-vibrant-blue" />
                        </div>
                        <Input
                          id="email"
                          type="email"
                          placeholder="name@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          autoComplete="email"
                          className="pl-10 border-gray-200 focus:border-vibrant-purple focus:ring-vibrant-purple"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="password" className="text-gray-700">
                          Password
                        </Label>
                        <Link href="/forgot-password" className="text-xs text-vibrant-purple hover:underline">
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <div className="absolute left-3 top-1/2 -translate-y-1/2">
                          <Lock className="h-5 w-5 text-vibrant-purple" />
                        </div>
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          autoComplete="current-password"
                          className="pl-10 border-gray-200 focus:border-vibrant-purple focus:ring-vibrant-purple"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-vibrant-purple"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember"
                        checked={rememberMe}
                        onCheckedChange={setRememberMe}
                        className="border-gray-300 text-vibrant-purple focus:ring-vibrant-purple"
                      />
                      <Label htmlFor="remember" className="text-sm text-gray-600">
                        Remember me for 30 days
                      </Label>
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-vibrant-purple to-vibrant-blue hover:opacity-90 transition-opacity"
                      disabled={isLoading}
                    >
                      {isLoading ? "Signing in..." : "Sign in"}
                    </Button>
                  </form>
                </CardContent>
                <CardFooter className="flex flex-col space-y-4">
                  <div className="relative w-full">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200"></span>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-white px-2 text-gray-500">Or continue with</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                      <Github className="mr-2 h-4 w-4 text-vibrant-purple" />
                      GitHub
                    </Button>
                    <Button variant="outline" className="w-full border-gray-200 hover:bg-gray-50 hover:border-gray-300">
                      <Mail className="mr-2 h-4 w-4 text-vibrant-blue" />
                      Google
                    </Button>
                  </div>
                  <p className="text-center text-sm text-gray-500">
                    Don't have an account?{" "}
                    <Link href="/signup" className="text-vibrant-purple hover:underline font-medium">
                      Sign up
                    </Link>
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>

            <TabsContent value="sso">
              <Card className="border-none shadow-xl bg-white/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-xl gradient-text gradient-purple">Single Sign-On</CardTitle>
                  <CardDescription>Sign in with your organization's SSO provider</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sso-email" className="text-gray-700">
                      Work Email
                    </Label>
                    <div className="relative">
                      <div className="absolute left-3 top-1/2 -translate-y-1/2">
                        <Mail className="h-5 w-5 text-vibrant-blue" />
                      </div>
                      <Input
                        id="sso-email"
                        type="email"
                        placeholder="name@company.com"
                        autoComplete="email"
                        className="pl-10 border-gray-200 focus:border-vibrant-purple focus:ring-vibrant-purple"
                      />
                    </div>
                  </div>
                  <Button className="w-full bg-gradient-to-r from-vibrant-purple to-vibrant-blue hover:opacity-90 transition-opacity">
                    Continue with SSO
                  </Button>
                </CardContent>
                <CardFooter>
                  <p className="text-center text-sm text-gray-500 w-full">
                    Contact your administrator if you're having trouble with SSO access.
                  </p>
                </CardFooter>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
