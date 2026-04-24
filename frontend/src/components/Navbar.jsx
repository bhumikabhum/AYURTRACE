import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBlockchain } from '../context/BlockchainContext'

const ROLE_ICONS = {
  collector: '🌿', aggregator: '📦', processor: '⚗️',
  manufacturer: '🏭', admin: '⚙️'
}

export default function Navbar() {
  const { user, logout } = useAuth()
  const { account, connectWallet, disconnectWallet, connecting } = useBlockchain()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    disconnectWallet()
    navigate('/')
  }

  const shortAddr = (addr) => addr ? `${addr.slice(0,6)}…${addr.slice(-4)}` : ''

  return (
    <nav className="bg-forest text-white px-4 py-3 shadow-lg">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold">
          <span>🌿</span>
          <span>AyurTrace</span>
        </Link>

        {/* Nav links */}
        {user && (
          <div className="hidden md:flex items-center gap-1">
            <Link to="/dashboard" className="px-3 py-1.5 rounded hover:bg-moss transition-colors text-sm">
              Dashboard
            </Link>
            {(user.role === 'collector' || user.role === 'admin') && (
              <Link to="/collect" className="px-3 py-1.5 rounded hover:bg-moss transition-colors text-sm">
                Collect Herb
              </Link>
            )}
            {['aggregator','processor','manufacturer','admin'].includes(user.role) && (
              <Link to="/supply" className="px-3 py-1.5 rounded hover:bg-moss transition-colors text-sm">
                Log Event
              </Link>
            )}
            {user.role === 'admin' && (
              <Link to="/admin" className="px-3 py-1.5 rounded hover:bg-moss transition-colors text-sm">
                Admin
              </Link>
            )}
          </div>
        )}

        {/* Right side */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <div className="text-sm hidden md:block">
                <span className="opacity-60 mr-1">{ROLE_ICONS[user.role]}</span>
                <span className="font-semibold">{user.name}</span>
                <span className="opacity-50 ml-1 text-xs">({user.role})</span>
              </div>
              {account && (
                <span className="text-xs font-mono bg-moss px-2 py-1 rounded hidden md:block">
                  {shortAddr(account)}
                </span>
              )}
              <button onClick={handleLogout} className="text-sm bg-red-700 hover:bg-red-600 px-3 py-1.5 rounded transition-colors">
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className="btn-gold text-sm px-4 py-1.5 rounded font-semibold">
              Connect Wallet
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}
