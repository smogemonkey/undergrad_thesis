"use client"

import ComponentSummary from "@/components/component-summary";
import { Navbar } from "@/components/navbar";
import { InteractiveDashboard } from "@/components/interactive-dashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheckIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Github, Upload, FileText, Shield } from "lucide-react";
import { githubService } from "@/services/githubService";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/projects");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleGitHubSignIn = () => {
    githubService.initiateAuth();
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          <div className="mt-12 text-lg font-semibold animate-pulse">Loading server...</div>
        </main>
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <Navbar />
        <main className="flex min-h-screen flex-col items-center justify-center p-24">
          <Card className="w-[400px] text-center">
            <CardHeader>
              <ShieldCheckIcon className="mx-auto h-12 w-12 text-blue-500" />
              <CardTitle className="mt-4">Welcome to VulnView</CardTitle>
              <CardDescription>Please log in to access the dashboard.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                      Or
                    </span>
                  </div>
                </div>
                <Link href="/login">
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" className="w-full">Create Account</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  // Authenticated users will be redirected to /projects
  return null;
} 