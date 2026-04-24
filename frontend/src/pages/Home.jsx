import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const nodes = [
  { icon: '🌿', label: 'Wild Collector', desc: 'GPS-tagged herb pickup with photo proof' },
  { icon: '📦', label: 'Aggregator', desc: 'Batch weighing, grading & mandi handover' },
  { icon: '⚗️', label: 'Processor', desc: 'Cleaning, drying, extraction & QC logging' },
  { icon: '🏭', label: 'Manufacturer', desc: 'Formulation batch record on blockchain' },
  { icon: '📱', label: 'QR Label', desc: 'Consumer scans to verify full journey' },
]

export default function Home() {
  const { user } = useAuth()

  return (
    <div>
      {/* Hero */}
      <div className="bg-forest text-white py-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 text-9xl flex items-center justify-end pr-16 select-none">🌿</div>
        <div className="max-w-3xl mx-auto relative">
          <div className="inline-block bg-gold text-forest text-xs font-bold px-3 py-1 rounded mb-4 tracking-widest uppercase">
            Blockchain Traceability · Final Year Project
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 leading-tight">
            From Forest to Label,<br/>Every Step Verified
          </h1>
          <p className="text-sage text-lg mb-8 max-w-xl">
            AyurTrace uses blockchain to create a tamper-proof record of Ayurvedic herbs — 
            geo-tagged from wild collector to final product, scannable by any consumer.
          </p>
          <div className="flex flex-wrap gap-3">
            {user ? (
              <Link to="/dashboard" className="btn-gold px-6 py-3 rounded-lg font-bold text-base">
                Go to Dashboard →
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-gold px-6 py-3 rounded-lg font-bold text-base">
                  Get Started →
                </Link>
                <Link to="/login" className="btn-secondary px-6 py-3 rounded-lg font-bold text-base bg-transparent border-white text-white hover:bg-moss">
                  Login
                </Link>
              </>
            )}
            <Link to="/verify/DEMO-HERB-001" className="px-6 py-3 rounded-lg border border-sage text-sage hover:bg-moss transition-colors font-semibold text-base">
              Try Verify Demo →
            </Link>
          </div>
        </div>
      </div>

      {/* Chain flow */}
      <div className="bg-white py-12 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-center font-display text-2xl font-bold text-forest mb-8">
            The Traceability Chain
          </h2>
          <div className="flex flex-wrap md:flex-nowrap items-center gap-1 justify-center">
            {nodes.map((n, i) => (
              <div key={i} className="flex items-center gap-1 flex-1 min-w-[120px]">
                <div className="card flex-1 text-center hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-2">{n.icon}</div>
                  <div className="font-bold text-forest text-sm">{n.label}</div>
                  <div className="text-gray-500 text-xs mt-1">{n.desc}</div>
                </div>
                {i < nodes.length - 1 && (
                  <div className="text-gold text-xl font-bold hidden md:block">›</div>
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 bg-forest text-gold rounded-xl p-3 text-center text-sm font-mono tracking-wide">
            ⛓ BLOCKCHAIN LEDGER · All events immutable & verifiable · Polygon Amoy Testnet
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="py-12 px-4 bg-cream">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-display text-2xl font-bold text-forest mb-8 text-center">Features</h2>
          <div className="grid md:grid-cols-3 gap-5">
            {[
              { icon: '📍', title: 'GPS Geo-tagging', desc: 'Every collection point recorded with GPS coordinates from the collector\'s phone' },
              { icon: '⛓', title: 'Blockchain Immutable', desc: 'Each supply chain step is a signed blockchain transaction — cannot be altered' },
              { icon: '🔲', title: 'QR Verification', desc: 'Consumers scan a QR on the label to see the complete herb journey' },
              { icon: '📷', title: 'Photo Evidence', desc: 'Collectors upload photos at collection time, stored on IPFS permanently' },
              { icon: '🗺', title: 'Journey Map', desc: 'Interactive Leaflet.js map showing the herb\'s geographical journey' },
              { icon: '📊', title: 'Analytics Dashboard', desc: 'Admin view with stats, active batches, and node activity charts' },
            ].map((f, i) => (
              <div key={i} className="card hover:shadow-md transition-shadow">
                <div className="text-2xl mb-2">{f.icon}</div>
                <div className="font-bold text-forest mb-1">{f.title}</div>
                <div className="text-gray-500 text-sm">{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stack */}
      <div className="bg-forest text-white py-10 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-sage text-xs tracking-widest uppercase mb-4">100% Free Tech Stack</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Hardhat', 'Solidity', 'Polygon Amoy', 'Node.js', 'Express', 'Supabase', 'React', 'Ethers.js', 'Leaflet.js', 'Vercel', 'Render.com'].map(t => (
              <span key={t} className="bg-moss px-3 py-1 rounded text-sm font-mono">{t}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
