import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBlockchain } from '../context/BlockchainContext'

export default function Login() {
  const { login, fetchUser } = useAuth()
  const { connectWallet, signMessage, account, connecting } = useBlockchain()
  const navigate = useNavigate()
  const [step, setStep] = useState('connect') // connect | sign | done
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setError('')
    const result = await connectWallet()
    if (result) setStep('sign')
  }

  const handleLogin = async () => {
    setLoading(true)
    setError('')
    try {
      const address = account
      // Check if registered
      const existingUser = await fetchUser(address)
      if (!existingUser) {
        setError('Wallet not registered. Please register first.')
        setStep('connect')
        return
      }
      // Sign a message to prove wallet ownership
      const message = `AyurTrace Login: ${address}\nTimestamp: ${Date.now()}`
      const signature = await signMessage(message)
      await login(address, signature, message)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="card max-w-md w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🦊</div>
          <h1 className="font-display text-2xl font-bold text-forest">Connect to AyurTrace</h1>
          <p className="text-gray-500 text-sm mt-1">Use your MetaMask wallet to sign in</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'connect' && (
          <div className="space-y-4">
            <div className="bg-pale rounded-lg p-4 text-sm text-forest">
              <p className="font-semibold mb-1">How it works:</p>
              <ol className="list-decimal list-inside space-y-1 text-gray-600">
                <li>Connect your MetaMask wallet</li>
                <li>Sign a message to prove ownership</li>
                <li>You're logged in — no password needed!</li>
              </ol>
            </div>
            <button onClick={handleConnect} disabled={connecting} className="btn-primary w-full flex items-center justify-center gap-2">
              {connecting ? 'Connecting...' : '🦊 Connect MetaMask'}
            </button>
          </div>
        )}

        {step === 'sign' && (
          <div className="space-y-4">
            <div className="bg-pale rounded-lg p-4 text-sm">
              <p className="font-semibold text-forest mb-1">Wallet connected!</p>
              <p className="font-mono text-xs text-gray-600 break-all">{account}</p>
            </div>
            <p className="text-sm text-gray-500 text-center">Click below to sign a message — this proves you own this wallet (no gas fee)</p>
            <button onClick={handleLogin} disabled={loading} className="btn-primary w-full">
              {loading ? 'Signing...' : '✍️ Sign & Login'}
            </button>
          </div>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Don't have an account?{' '}
          <Link to="/register" className="text-forest font-semibold hover:text-moss">Register here</Link>
        </p>
      </div>
    </div>
  )
}
