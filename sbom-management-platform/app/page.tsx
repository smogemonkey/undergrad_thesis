"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Dashboard } from "@/components/dashboard"

export default function Home() {
  const router = useRouter()

  // Check for authentication on client side as well
  useEffect(() => {
    // This is a simplified check - in a real app, you'd verify the token
    const authToken = document.cookie.includes("auth-token")

    if (!authToken) {
      router.push("/login")
    }
  }, [router])

  return (
    <main className="min-h-screen flex flex-col">
      <Navbar />
      <Dashboard />
    </main>
  )
}
