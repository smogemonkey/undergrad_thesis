"use client"

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { User } from "@/types/user";

interface AuthContextType {
  isAuthenticated: boolean
  user: User | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  getAuthHeaders: () => HeadersInit
  checkAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Utility function to check if token is expired
const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    checkAuth()
    // Set up token refresh interval
    const refreshInterval = setInterval(() => {
      const token = localStorage.getItem('token')
      if (token && isTokenExpired(token)) {
        checkAuth()
      }
    }, 60000) // Check every minute

    return () => clearInterval(refreshInterval)
  }, [])

  const getAuthHeaders = (): HeadersInit => {
    const token = localStorage.getItem('token')
    if (!token) {
      throw new Error('No authentication token available')
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  }

  const checkAuth = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        setIsLoading(false)
        return
      }

      if (isTokenExpired(token)) {
        throw new Error('Token expired')
      }

      const response = await fetch('http://localhost:8080/api/v1/users/me', {
        headers: getAuthHeaders()
      })
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
        setIsAuthenticated(true)
      } else if (response.status === 401) {
        // Token is invalid or expired
        localStorage.removeItem('token')
        setUser(null)
        setIsAuthenticated(false)
        throw new Error('Session expired. Please log in again.')
      } else {
        throw new Error('Authentication failed')
      }
    } catch (error) {
      console.error('Auth check failed:', error)
      localStorage.removeItem('token')
      setUser(null)
      setIsAuthenticated(false)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (username: string, password: string) => {
    try {
      console.log('Attempting login with username:', username);
      const response = await fetch('http://localhost:8080/api/v1/auth/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();
      console.log('Login response:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      if (!data.token) {
        throw new Error('No authentication token received from server.');
      }

      localStorage.setItem('token', data.token);
      await checkAuth(); // Fetch user data after successful login
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
    setIsAuthenticated(false)
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading, getAuthHeaders, checkAuth }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
} 