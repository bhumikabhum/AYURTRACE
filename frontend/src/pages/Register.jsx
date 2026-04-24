import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBlockchain } from '../context/BlockchainContext'

const ROLES = [
  { value: 'collector',    icon: '🌿', label: 'Wild Collector',   desc: 'I collect herbs from forests/farms' },
  { value: 'aggregator',   icon: '📦', label: 'Aggregator',       desc: 'I buy and grade herbs at mandi/wholesale' },
  { value: 'processor',    icon: '⚗️', label: 'Processor',        desc: 'I clean, dry, and process herbs' },
  { value: 'manufacturer', icon: '🏭', label: 'Manufacturer',     desc: 'I formulate Ayurvedic products' },
  { value: 'admin',        icon: '⚙️', label: 'Admin (Demo)',     desc: 'Platform administrator / demo access' },
]

export default function Register() {
  const { register } = useAuth()
  const { connectWallet, account, connecting, isCorrectNetwork, switchNetwork } = useBlockchain()
  const navigate = useNavigate()
  const [step, setStep] = useState('connect')
  const [form, setForm] = useState({ name: '', role: '', location: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConnect = async () => {
    setError('')
    const result = await connectWallet()
    if (result) setStep('form')
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.name || !form.role) {
      setError('Name and role are required')
      return
    }
    setLoading(true)
    setError('')
    try {
      await register(account, form.role, form.name, form.location)
      navigate('/dashboard')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="card max-w-lg w-full">
        <div className="text-center mb-6">
          <div className="text-4xl mb-2">🌿</div>
          <h1 className="font-display text-2xl font-bold text-forest">Join AyurTrace</h1>
          <p className="text-gray-500 text-sm mt-1">Register with your MetaMask wallet</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {step === 'connect' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">First, connect your MetaMask wallet. Your wallet address becomes your unique identity on the blockchain.</p>
            <button onClick={handleConnect} disabled={connecting} className="btn-primary w-full">
              {connecting ? 'Connecting...' : '🦊 Connect MetaMask'}
            </button>
            <p className="text-xs text-center text-gray-400">
              Need MetaMask? <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-forest hover:underline">Download it here</a>
            </p>
          </div>
        )}

        {step === 'form' && (
          <form onSubmit={handleRegister} className="space-y-5">
            {/* Wallet info */}
            <div className="bg-pale rounded-lg p-3">
              <p className="text-xs font-semibold text-forest mb-1">Wallet Connected</p>
              <p className="font-mono text-xs text-gray-600 break-all">{account}</p>
              {!isCorrectNetwork && (
                <button type="button" onClick={switchNetwork} className="mt-2 text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  ⚠️ Switch to Polygon Amoy
                </button>
              )}
            </div>

            {/* Name */}
            <div>
              <label className="label">Your Name / Organisation</label>
              <input
                className="input"
                placeholder="e.g., Ramu Kumar / Herbal Farmers Co."
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>

            {/* Location */}
            <div>
              <label className="label">Location (optional)</label>
              <input
                className="input"
                placeholder="e.g., Mysuru, Karnataka"
                value={form.location}
                onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              />
            </div>

            {/* Role selection */}
            <div>
              <label className="label">Select Your Role</label>
              <div className="grid gap-2">
                {ROLES.map(r => (
                  <label
                    key={r.value}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                      form.role === r.value
                        ? 'border-forest bg-pale'
                        : 'border-gray-200 hover:border-sage'
                    }`}
                  >
                    <input
                      type="radio"
                      name="role"
                      value={r.value}
                      checked={form.role === r.value}
                      onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                      className="accent-forest"
                    />
                    <span className="text-xl">{r.icon}</span>
                    <div>
                      <div className="font-semibold text-forest text-sm">{r.label}</div>
                      <div className="text-gray-500 text-xs">{r.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? 'Registering...' : '✅ Register'}
            </button>
          </form>
        )}

        <p className="text-center text-sm text-gray-500 mt-5">
          Already registered?{' '}
          <Link to="/login" className="text-forest font-semibold hover:text-moss">Login here</Link>
        </p>
      </div>
    </div>
  )
}
