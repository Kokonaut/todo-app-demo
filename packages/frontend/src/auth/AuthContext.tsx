import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import {
  CognitoUser,
  AuthenticationDetails,
  CognitoUserAttribute,
  CognitoUserSession
} from 'amazon-cognito-identity-js'
import { userPool } from './config'
import type { User } from '@todo-app/shared'

export interface AuthContextType {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name?: string) => Promise<{ userConfirmed: boolean }>
  confirmSignup: (email: string, code: string) => Promise<void>
  logout: () => void
  getAccessToken: () => Promise<string | null>
}

// Shared context - exported so LocalAuthProvider can use it too
export const AuthContext = createContext<AuthContextType | null>(null)

export function CognitoAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check for existing session on mount
  useEffect(() => {
    const cognitoUser = userPool.getCurrentUser()

    if (cognitoUser) {
      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) {
          setIsLoading(false)
          return
        }

        const idToken = session.getIdToken()
        setUser({
          id: idToken.payload.sub,
          email: idToken.payload.email,
          name: idToken.payload.name
        })
        setIsLoading(false)
      })
    } else {
      setIsLoading(false)
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      })

      const authDetails = new AuthenticationDetails({
        Username: email,
        Password: password
      })

      cognitoUser.authenticateUser(authDetails, {
        onSuccess: (session) => {
          const idToken = session.getIdToken()
          setUser({
            id: idToken.payload.sub,
            email: idToken.payload.email,
            name: idToken.payload.name
          })
          resolve()
        },
        onFailure: (err) => {
          reject(new Error(err.message || 'Login failed'))
        },
        newPasswordRequired: () => {
          reject(new Error('New password required'))
        }
      })
    })
  }, [])

  const signup = useCallback(async (
    email: string,
    password: string,
    name?: string
  ): Promise<{ userConfirmed: boolean }> => {
    return new Promise((resolve, reject) => {
      const attributes: CognitoUserAttribute[] = [
        new CognitoUserAttribute({ Name: 'email', Value: email })
      ]

      if (name) {
        attributes.push(new CognitoUserAttribute({ Name: 'name', Value: name }))
      }

      userPool.signUp(email, password, attributes, [], (err, result) => {
        if (err) {
          reject(new Error(err.message || 'Signup failed'))
          return
        }
        resolve({ userConfirmed: result?.userConfirmed ?? false })
      })
    })
  }, [])

  const confirmSignup = useCallback(async (email: string, code: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const cognitoUser = new CognitoUser({
        Username: email,
        Pool: userPool
      })

      cognitoUser.confirmRegistration(code, true, (err) => {
        if (err) {
          reject(new Error(err.message || 'Confirmation failed'))
          return
        }
        resolve()
      })
    })
  }, [])

  const logout = useCallback(() => {
    const cognitoUser = userPool.getCurrentUser()
    if (cognitoUser) {
      cognitoUser.signOut()
    }
    setUser(null)
  }, [])

  const getAccessToken = useCallback(async (): Promise<string | null> => {
    return new Promise((resolve) => {
      const cognitoUser = userPool.getCurrentUser()

      if (!cognitoUser) {
        resolve(null)
        return
      }

      cognitoUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err || !session?.isValid()) {
          resolve(null)
          return
        }
        resolve(session.getIdToken().getJwtToken())
      })
    })
  }, [])

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

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
