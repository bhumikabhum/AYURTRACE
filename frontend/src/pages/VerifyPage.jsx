import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000'

const NODE_ICONS  = { collector: '🌿', aggregator: '📦', processor: '⚗️', manufacturer: '🏭' }
const NODE_LABELS = { collector: 'Wild Collector', aggregator: 'Aggregator', processor: 'Processor', manufacturer: 'Manufacturer' }
const NODE_COLORS = { collector: '#2d6a4f', aggregator: '#d97706', processor: '#7c3aed', manufacturer: '#1a3c2b' }

// ── Demo data shown when batch not found in DB ──
const DEMO_DATA = {
  verified: true,
  batchId: 'DEMO-HERB-001',
  herbName: 'Ashwagandha',
  herbLatin: 'Withania somnifera',
  quantityKg: 5.5,
  status: 'completed',
  currentNode: 'manufacturer',
  createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  updatedAt: new Date().toISOString(),
  isDemo: true,
  trail: [
    {
      step: 1,
      nodeType: 'collector',
      nodeLabel: 'Wild Collector',
      actorName: 'Ramu Kumar',
      actorWallet: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      location: { latitude: 12.9716, longitude: 77.5946, name: 'Mysuru Forest, Karnataka' },
      notes: 'Fresh Ashwagandha roots collected at dawn. Soil moist, roots 8-10cm. No pesticide use in surrounding 2km.',
      photoUrl: null,
      txHash: '0xabc123demo456txhash789blockchain',
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      step: 2,
      nodeType: 'aggregator',
      nodeLabel: 'Aggregator',
      actorName: 'Mysuru Mandi Traders',
      actorWallet: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      location: { latitude: 12.9800, longitude: 77.6100, name: 'Mysuru APMC Mandi, Karnataka' },
      notes: 'Batch weighed: 5.5 kg. Grade A quality. Moisture content 11.2%. No visible contamination. Packaged in breathable jute bags.',
      photoUrl: null,
      txHash: '0xdef456demo789txhash012blockchain',
      timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      step: 3,
      nodeType: 'processor',
      nodeLabel: 'Processor',
      actorName: 'HerbalTech Processing Unit',
      actorWallet: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      location: { latitude: 12.9165, longitude: 74.8560, name: 'Mangaluru Processing Facility, Karnataka' },
      notes: 'Cleaned and sun-dried for 3 days. Withanolide content tested: 5.2%. QC passed. Batch dried weight: 4.8 kg.',
      photoUrl: null,
      txHash: '0xghi789demo012txhash345blockchain',
      timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      step: 4,
      nodeType: 'manufacturer',
      nodeLabel: 'Manufacturer',
      actorName: 'AyurCo Naturals Pvt Ltd',
      actorWallet: '0x90F79bf6EB2c4f870365E785982E1f101E93b906',
      location: { latitude: 19.0760, longitude: 72.8777, name: 'Mumbai Manufacturing Plant, Maharashtra' },
      notes: 'Ashwagandha capsules Batch #AC-2024-001. 500mg per capsule, 60 capsules per bottle. Manufactured under GMP conditions.',
      photoUrl: null,
      txHash: '0xjkl012demo345txhash678blockchain',
      timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ],
  onChainVerified: false,
  summary: {
    totalNodes: 4,
    originLocation: 'Mysuru Forest, Karnataka',
    originDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    isComplete: true,
    isBlockchainVerified: false,
  }
}

export default function VerifyPage() {
  const { batchId } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [mapLoaded, setMapLoaded] = useState(false)

  useEffect(() => {
    // If demo batch — use demo data immediately, no API call needed
    if (batchId === 'DEMO-HERB-001') {
      setTimeout(() => { setData(DEMO_DATA); setLoading(false) }, 600)
      return
    }
    fetch(`${API}/api/verify/${batchId}`)
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
      .catch(() => { setData(DEMO_DATA); setLoading(false) })
  }, [batchId])

  // Load Leaflet map after data arrives
  useEffect(() => {
    if (!data?.trail?.length) return
    const hasCoords = data.trail.some(e => e.location?.latitude && e.location?.longitude)
    if (!hasCoords) return

    const initMap = () => {
      if (typeof window.L === 'undefined') { setTimeout(initMap, 500); return }
      const L = window.L
      const mapEl = document.getElementById('herb-map')
      if (!mapEl || mapEl._leaflet_id) return

      const validPoints = data.trail.filter(e => e.location?.latitude && e.location?.longitude)
      if (!validPoints.length) return

      const map = L.map('herb-map').setView(
        [validPoints[0].location.latitude, validPoints[0].location.longitude], 6
      )
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map)

      if (validPoints.length > 1) {
        const latlngs = validPoints.map(e => [e.location.latitude, e.location.longitude])
        L.polyline(latlngs, { color: '#c9a84c', weight: 3, dashArray: '6 4' }).addTo(map)
      }

      validPoints.forEach((e) => {
        const color = NODE_COLORS[e.nodeType] || '#1a3c2b'
        const icon = L.divIcon({
          html: `<div style="background:${color};color:white;border-radius:50%;width:30px;height:30px;display:flex;align-items:center;justify-content:center;font-size:14px;border:2px solid white;box-shadow:0 2px 4px rgba(0,0,0,.3)">${NODE_ICONS[e.nodeType] || '📍'}</div>`,
          iconSize: [30, 30], iconAnchor: [15, 15], className: ''
        })
        L.marker([e.location.latitude, e.location.longitude], { icon })
          .addTo(map)
          .bindPopup(`<b>${NODE_LABELS[e.nodeType]}</b><br>${e.location.name || ''}<br>${e.actorName}`)
      })

      if (validPoints.length > 1) {
        const bounds = L.latLngBounds(validPoints.map(e => [e.location.latitude, e.location.longitude]))
        map.fitBounds(bounds, { padding: [30, 30] })
      }
      setMapLoaded(true)
    }

    // Load Leaflet script if not already loaded
    if (typeof window.L === 'undefined') {
      const script = document.createElement('script')
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
      script.onload = initMap
      document.head.appendChild(script)
    } else {
      initMap()
    }
  }, [data])

  if (loading) return (
    <div className="flex items-center justify-center h-screen text-forest text-lg">
      <div className="text-center">
        <div className="text-5xl mb-3 animate-pulse">🌿</div>
        <p>Verifying herb journey...</p>
      </div>
    </div>
  )

  if (!data?.verified) return (
    <div className="flex items-center justify-center h-screen px-4">
      <div className="card text-center max-w-md">
        <div className="text-5xl mb-3">❌</div>
        <h2 className="font-display text-xl font-bold text-red-600 mb-2">Verification Failed</h2>
        <p className="text-gray-500">Batch not found or invalid QR code.</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-cream">
      {/* Demo banner */}
      {data.isDemo && (
        <div className="bg-gold text-forest text-center text-xs font-bold py-2 px-4 tracking-wide">
          🌿 DEMO MODE — This is sample data showing how AyurTrace works. Real batches show live blockchain transactions.
        </div>
      )}

      {/* Header */}
      <div className="bg-forest text-white px-4 py-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center text-forest font-bold text-lg">✓</div>
            <div>
              <h1 className="font-display text-xl font-bold">
                {data.herbName} <span className="text-sage text-sm italic font-normal">{data.herbLatin}</span>
              </h1>
              <p className="text-sage text-xs font-mono">{data.batchId}</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="bg-moss rounded-lg p-3 text-center">
              <div className="text-gold font-bold text-lg">{data.trail?.length || 0}</div>
              <div className="text-sage text-xs">Chain Nodes</div>
            </div>
            <div className="bg-moss rounded-lg p-3 text-center">
              <div className="text-gold font-bold text-lg">{data.quantityKg} kg</div>
              <div className="text-sage text-xs">Quantity</div>
            </div>
            <div className="bg-moss rounded-lg p-3 text-center">
              <div className={`font-bold text-lg ${data.status === 'completed' ? 'text-green-300' : 'text-yellow-300'}`}>
                {data.status === 'completed' ? '✅' : '🔄'}
              </div>
              <div className="text-sage text-xs capitalize">{data.status}</div>
            </div>
          </div>

          {data.onChainVerified && (
            <div className="mt-3 bg-green-900 border border-green-600 rounded-lg px-3 py-2 text-xs text-green-200 flex items-center gap-2">
              <span>⛓</span>
              <span>Blockchain verified — data is immutable and tamper-proof</span>
            </div>
          )}
          {data.isDemo && (
            <div className="mt-3 bg-yellow-900 border border-yellow-600 rounded-lg px-3 py-2 text-xs text-yellow-200 flex items-center gap-2">
              <span>🎯</span>
              <span>Demo batch — showing sample Ashwagandha traceability journey across India</span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Map */}
        {data.trail?.some(e => e.location?.latitude) && (
          <div>
            <h2 className="font-bold text-forest mb-2">📍 Journey Map</h2>
            <div id="herb-map" className="w-full h-64 rounded-xl border border-gray-200 shadow-sm bg-gray-100" />
          </div>
        )}

        {/* Trail */}
        <div>
          <h2 className="font-bold text-forest mb-3">🗓 Traceability Trail</h2>
          <div className="space-y-3">
            {data.trail?.map((event, i) => (
              <div key={i} className="card border-l-4" style={{ borderLeftColor: NODE_COLORS[event.nodeType] }}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{NODE_ICONS[event.nodeType] || '📍'}</span>
                    <div>
                      <div className="font-bold text-forest text-sm">
                        Step {event.step}: {NODE_LABELS[event.nodeType] || event.nodeType}
                      </div>
                      <div className="text-gray-500 text-xs">{event.actorName}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(event.timestamp).toLocaleDateString()}
                  </div>
                </div>

                {event.location?.name && (
                  <div className="mt-2 text-xs text-gray-500 flex items-center gap-1">
                    <span>📍</span> {event.location.name}
                    {event.location.latitude && (
                      <span className="font-mono text-gray-400 ml-1">
                        ({event.location.latitude.toFixed(4)}, {event.location.longitude.toFixed(4)})
                      </span>
                    )}
                  </div>
                )}

                {event.notes && (
                  <div className="mt-2 bg-gray-50 rounded p-2 text-xs text-gray-600 italic">
                    "{event.notes}"
                  </div>
                )}

                {event.txHash && !data.isDemo && (
                  <a
                    href={`https://amoy.polygonscan.com/tx/${event.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 flex items-center gap-1 text-xs text-moss hover:underline"
                  >
                    <span>⛓</span>
                    <span className="font-mono truncate">{event.txHash.slice(0, 20)}...</span>
                    <span>↗</span>
                  </a>
                )}
                {event.txHash && data.isDemo && (
                  <div className="mt-2 flex items-center gap-1 text-xs text-gray-400">
                    <span>⛓</span>
                    <span className="font-mono truncate">{event.txHash.slice(0, 30)}... (demo)</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-forest text-white rounded-xl p-4 text-center">
          <p className="text-sage text-xs font-mono tracking-wider mb-1">VERIFIED BY AYURTRACE</p>
          <p className="text-xs text-gray-400">Origin: {data.summary?.originLocation}</p>
          <p className="text-xs text-gray-400">
            First recorded: {data.summary?.originDate ? new Date(data.summary.originDate).toLocaleDateString() : '-'}
          </p>
          {data.isDemo && (
            <p className="text-xs text-gold mt-2">🌿 Try it live — create a real batch as a Collector!</p>
          )}
        </div>
      </div>
    </div>
  )
}