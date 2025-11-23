import { useState, useEffect, useCallback, ReactNode } from 'react'
import type { User } from '@todo-app/shared'
import { AuthContext } from './AuthContext'

const LOCAL_STORAGE_KEY = 'local_auth_user'

function generateUserId(): string {
  return 'local-' + Math.random().toString(36).substring(2, 15)
}

function createMockToken(user: User): string {
  // Create a simple JWT-like token that the backend can decode
  const header = btoa(JSON.stringify({ alg: 'none', typ: 'JWT' }))
  const payload = btoa(JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 86400 // 24 hours
  }))
  return `${header}.${payload}.mock-signature`
}

export function LocalAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(LOCAL_STORAGE_KEY)
    if (stored) {
      try {
        setUser(JSON.parse(stored))
      } catch {
        localStorage.removeItem(LOCAL_STORAGE_KEY)
      }
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    // For local dev, accept any non-empty password
    if (!password || password.length < 1) {
      throw new Error('Password is required')
    }

    // Check if user exists in local storage registry
    const usersKey = 'local_auth_users'
    const users: Record<string, User> = JSON.parse(localStorage.getItem(usersKey) || '{}')

    let localUser = users[email]
    if (!localUser) {
      // Auto-create user on first login for convenience
      localUser = {
        id: generateUserId(),
        email,
        name: email.split('@')[0]
      }
      users[email] = localUser
      localStorage.setItem(usersKey, JSON.stringify(users))
    }

    setUser(localUser)
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(localUser))
  }, [])

  const signup = useCallback(async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ userConfirmed: boolean }> => {
    if (!email || !password) {
      throw new Error('Email and password are required')
    }

    const usersKey = 'local_auth_users'
    const users: Record<string, User> = JSON.parse(localStorage.getItem(usersKey) || '{}')

    if (users[email]) {
      throw new Error('User already exists')
    }

    const newUser: User = {
      id: generateUserId(),
      email,
      name: name || email.split('@')[0]
    }

    users[email] = newUser
    localStorage.setItem(usersKey, JSON.stringify(users))

    // Auto-confirm for local dev
    return { userConfirmed: true }
  }, [])

  const confirmSignup = useCallback(async (_email: string, _code: string): Promise<void> => {
    // No-op for local auth - users are auto-confirmed
    return Promise.resolve()
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(LOCAL_STORAGE_KEY)
  }, [])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null
    return createMockToken(user)
  }, [user])

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        signup,
        confirmSignup,
        logout,
        getAccessToken
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}
