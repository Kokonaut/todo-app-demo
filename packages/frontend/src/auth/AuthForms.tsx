import { useState } from 'react'
import { useAuth } from './AuthContext'

type AuthMode = 'login' | 'signup' | 'confirm'

export function AuthForms() {
  const { login, signup, confirmSignup } = useAuth()
  const [mode, setMode] = useState<AuthMode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await login(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signup(email, password, name)
      if (!result.userConfirmed) {
        setMode('confirm')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Signup failed')
    } finally {
      setLoading(false)
    }
  }

  async function handleConfirm(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await confirmSignup(email, confirmCode)
      setMode('login')
      setError('')
      alert('Account confirmed! Please login.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Confirmation failed')
    } finally {
      setLoading(false)
    }
  }

  if (mode === 'confirm') {
    return (
      <div className="auth-container">
        <h2>Confirm Your Email</h2>
        <p className="auth-subtitle">Check your email for a verification code</p>

        {error && <p className="error">{error}</p>}

        <form onSubmit={handleConfirm} className="auth-form">
          <input
            type="text"
            placeholder="Verification code"
            value={confirmCode}
            onChange={e => setConfirmCode(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Confirming...' : 'Confirm'}
          </button>
        </form>

        <p className="auth-switch">
          <button type="button" onClick={() => setMode('login')}>
            Back to login
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="auth-container">
      <h2>{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>

      {error && <p className="error">{error}</p>}

      <form onSubmit={mode === 'login' ? handleLogin : handleSignup} className="auth-form">
        {mode === 'signup' && (
          <input
            type="text"
            placeholder="Name (optional)"
            value={name}
            onChange={e => setName(e.target.value)}
          />
        )}
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          minLength={8}
        />
        <button type="submit" disabled={loading}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Sign Up'}
        </button>
      </form>

      <p className="auth-switch">
        {mode === 'login' ? (
          <>
            Don't have an account?{' '}
            <button type="button" onClick={() => { setMode('signup'); setError('') }}>
              Sign up
            </button>
          </>
        ) : (
          <>
            Already have an account?{' '}
            <button type="button" onClick={() => { setMode('login'); setError('') }}>
              Login
            </button>
          </>
        )}
      </p>
    </div>
  )
}
