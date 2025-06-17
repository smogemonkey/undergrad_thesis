import { toast } from "sonner"
import { Octokit } from "@octokit/rest"
import { API_ENDPOINTS } from "@/lib/constants"

export interface GitHubUser {
  id: number
  login: string
  name: string
  avatar_url: string
  email: string
}

export interface GitHubRepo {
  id: number
  name: string
  full_name: string
  private: boolean
  default_branch: string
}

interface GitHubAuthResponse {
  token: string
  user: GitHubUser
}

class GitHubService {
  private static instance: GitHubService
  private jwtToken: string | null = null
  private githubToken: string | null = null
  private octokit: Octokit | null = null
  private readonly clientId: string
  private readonly apiUrl: string

  private constructor() {
    this.clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID || ""
    this.apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8080"

    // Initialize token from localStorage if available
    if (typeof window !== 'undefined') {
      this.jwtToken = localStorage.getItem('token')
    }
  }

  public static getInstance(): GitHubService {
    if (!GitHubService.instance) {
      GitHubService.instance = new GitHubService()
    }
    return GitHubService.instance
  }

  public initiateAuth(): void {
    if (typeof window === 'undefined') {
      console.error('Cannot initiate auth during server-side rendering')
      return
    }

    if (!this.clientId) {
      toast.error("GitHub client ID is not configured")
      return
    }

    const scope = 'read:user user:email repo'
    const redirectUri = `${window.location.origin}/auth/github/callback`
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: scope,
    })
    
    const authUrl = `https://github.com/login/oauth/authorize?${params.toString()}`
    window.location.href = authUrl
  }

  public async getUserInfo(): Promise<GitHubUser> {
    if (!this.githubToken) {
      throw new Error('Not authenticated with GitHub')
    }

    try {
      const response = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub user info')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching GitHub user info:', error)
      toast.error('Failed to fetch GitHub user information')
      throw error
    }
  }

  public async getRepositories(): Promise<GitHubRepo[]> {
    if (!this.githubToken) {
      throw new Error('Not authenticated with GitHub')
    }

    try {
      const response = await fetch('https://api.github.com/user/repos?sort=updated&per_page=100', {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch GitHub repositories')
      }

      return await response.json()
    } catch (error) {
      console.error('Error fetching GitHub repositories:', error)
      toast.error('Failed to fetch GitHub repositories')
      throw error
    }
  }

  public async downloadRepository(owner: string, repo: string, branch: string): Promise<Blob> {
    if (!this.githubToken) {
      throw new Error('Not authenticated with GitHub')
    }

    try {
      const response = await fetch(`/api/v1/github/download`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.githubToken}`,
        },
        body: JSON.stringify({ owner, repo, branch }),
      })

      if (!response.ok) {
        throw new Error('Failed to download repository')
      }

      return await response.blob()
    } catch (error) {
      console.error('Error downloading repository:', error)
      toast.error('Failed to download repository')
      throw error
    }
  }

  public isAuthenticated(): boolean {
    return !!this.jwtToken
  }

  public logout(): void {
    this.jwtToken = null
    this.githubToken = null
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    this.octokit = null
  }

  getAuthUrl(): string {
    if (typeof window === 'undefined') {
      throw new Error('Cannot get auth URL during server-side rendering')
    }

    const redirectUri = `${window.location.origin}/auth/github/callback`
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      scope: "read:user user:email repo",
    })
    return `https://github.com/login/oauth/authorize?${params.toString()}`
  }

  getJwtToken(): string | null {
    return this.jwtToken
  }

  setJwtToken(token: string) {
    this.jwtToken = token
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token)
    }
  }

  setGithubToken(token: string) {
    this.githubToken = token
  }

  async getUser(): Promise<GitHubUser | null> {
    const userStr = localStorage.getItem("user")
    if (!userStr) return null
    try {
      return JSON.parse(userStr)
    } catch {
      return null
    }
  }

  private async getOctokit(): Promise<Octokit> {
    if (!this.octokit) {
      const token = this.githubToken
      if (!token) {
        throw new Error("Not authenticated with GitHub")
      }
      this.octokit = new Octokit({ auth: token })
    }
    return this.octokit
  }

  async listRepositories(): Promise<any[]> {
    try {
      const octokit = await this.getOctokit()
      const { data } = await octokit.repos.listForAuthenticatedUser({
        sort: "updated",
        per_page: 100,
      })
      return data
    } catch (error) {
      console.error("Error listing repositories:", error)
      throw error
    }
  }

  async getRepositoryBranches(owner: string, repo: string): Promise<any[]> {
    try {
      const octokit = await this.getOctokit()
      const { data } = await octokit.repos.listBranches({
        owner,
        repo,
        per_page: 100,
      })
      return data
    } catch (error) {
      console.error("Error listing branches:", error)
      throw error
    }
  }
}

export const githubService = GitHubService.getInstance() 