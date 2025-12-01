'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { api } from '@/lib/api'

interface User {
  id: number
  username: string
  role: 'admin' | 'user'
  email: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (username: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
  isAuthenticated: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedToken = localStorage.getItem('token')
      const storedUser = localStorage.getItem('user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (username: string, password: string) => {
    try {
      const response = await api.login(username, password)
      
      if (response.status === 'success' && response.data) {
        const { token: newToken, user: newUser } = response.data
        
        if (typeof window !== 'undefined') {
          localStorage.setItem('token', newToken)
          localStorage.setItem('user', JSON.stringify(newUser))
        }

        setToken(newToken)
        setUser(newUser)
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Login failed')
    }
  }

  const logout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    }
    setToken(null)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    isLoading,
    isAuthenticated: !!token && !!user,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

