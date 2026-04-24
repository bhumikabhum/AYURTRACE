import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)
const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('ayurtrace_token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore user from localStorage
    const saved = localStorage.getItem('ayurtrace_user')
    if (saved && token) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
    setLoading(false)
  }, [token])

  const register = async (walletAddress, role, name, location) => {
    const res = await fetch(`${API}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, role, name, location })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Registration failed')
    saveSession(data.user, data.token)
    return data
  }

  const login = async (walletAddress, signature, message) => {
    const res = await fetch(`${API}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, signature, message })
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Login failed')
    saveSession(data.user, data.token)
    return data
  }

  const fetchUser = async (walletAddress) => {
    const res = await fetch(`${API}/api/auth/me/${walletAddress}`)
    if (!res.ok) return null
    const data = await res.json()
    return data.user
  }

  const saveSession = (userData, authToken) => {
    setUser(userData)
    setToken(authToken)
    localStorage.setItem('ayurtrace_token', authToken)
    localStorage.setItem('ayurtrace_user', JSON.stringify(userData))
  }

  const logout = () => {
    setUser(null)
    setToken(null)
    localStorage.removeItem('ayurtrace_token')
    localStorage.removeItem('ayurtrace_user')
  }

  const authFetch = async (url, options = {}) => {
    const res = await fetch(`${API}${url}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options.headers
      }
    })
    return res
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, register, login, logout, fetchUser, authFetch }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
