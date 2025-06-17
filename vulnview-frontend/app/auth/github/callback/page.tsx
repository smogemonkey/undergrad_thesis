'use client'

import { useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { githubService } from '@/services/githubService'
import { apiFetch } from '@/lib/api'
import { API_ENDPOINTS } from '@/lib/constants'

interface GitHubConnectResponse {
  githubUsername: string;
  message: string;
}

export default function GitHubCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const handledRef = useRef(false)

  useEffect(() => {
    const handleCallback = async () => {
      if (handledRef.current) return;
      handledRef.current = true;
      try {
        const code = searchParams.get('code')
        if (!code) {
          toast.error('No authorization code received')
          router.push('/projects')
          return
        }

        // Get JWT token from localStorage
        const token = githubService.getJwtToken()
        if (!token) {
          toast.error('Not authenticated')
          router.push('/login')
          return
        }

        // Exchange code for token
        const data = await apiFetch<GitHubConnectResponse>(
          API_ENDPOINTS.GITHUB.CALLBACK,
          {
            method: 'POST',
            body: JSON.stringify({ code })
          }
        )
        
        // Store GitHub username
        if (data.githubUsername) {
          githubService.setGithubToken(data.githubUsername)
          localStorage.setItem('githubUsername', data.githubUsername)
          toast.success(data.message || 'Successfully connected to GitHub')
        } else {
          throw new Error('No GitHub username received')
        }

        router.push('/projects')
      } catch (error) {
        console.error('GitHub authentication error:', error)
        toast.error(error instanceof Error ? error.message : 'Failed to connect to GitHub')
        router.push('/projects')
      }
    }

    handleCallback()
  }, [router, searchParams])

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-semibold mb-4">Connecting to GitHub...</h1>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
      </div>
    </div>
  )
} 