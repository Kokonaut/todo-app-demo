import { CognitoAuthProvider, useAuth } from './AuthContext'
import { LocalAuthProvider } from './LocalAuthContext'
export { AuthForms } from './AuthForms'
export { cognitoConfig } from './config'
export { useAuth }

const isLocalAuth = import.meta.env.VITE_LOCAL_AUTH === 'true'

export const AuthProvider = isLocalAuth ? LocalAuthProvider : CognitoAuthProvider
