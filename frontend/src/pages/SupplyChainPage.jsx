import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useBlockchain } from '../context/BlockchainContext'

const NODE_CONFIG = {
  aggregator:   { icon: '📦', label: 'Aggregator',   nodeIndex: 1, color: 'yellow',  placeholder: 'Batch weight verified, Grade A quality, moisture < 12%...' },
  processor:    { icon: '⚗️', label: 'Processor',    nodeIndex: 2, color: 'purple',  placeholder: 'Cleaned, sun-dried 3 days, extract yield 28%, QC passed...' },
  manufacturer: { icon: '🏭', label: 'Manufacturer', nodeIndex: 3, color: 'green',   placeholder: 'Ashwagandha capsules Batch #A001, 500mg per capsule, 60 capsules/bottle...' },
}

export default function SupplyChainPage() {
  const { user, authFetch } = useAuth()
  const { contract } = useBlockchain()
  const config = NODE_CONFIG[user?.role] || NODE_CONFIG.aggregator

  const [batches, setBatches] = useState([])
  const [selectedBatch, setSelectedBatch] = useState(null)
  const [form, setForm] = useState({ notes: '', locationName: '' })
  const [gps, setGps] = useState(null)
  const [loading, setLoading] = useState(false)
  const [txStatus, setTxStatus] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const load = async () => {
      const res = await authFetch('/api/batches')
      if (res.ok) {
        const d = await res.json()
        // Filter to batches that need this node's action
        const eligible = (d.batches || []).filter(b => b.status !== 'completed')
        setBatches(eligible)
      }
    }
    load()
  }, [])

  const getGPS = () => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      pos => setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => setError('GPS: ' + err.message)
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!selectedBatch) { setError('Select a batch first'); return }
    if (!form.notes) { setError('Notes are required'); return }
    setLoading(true)
    setError('')
    setTxStatus('Logging event...')

    try {
      let txHash = null

      // Blockchain write
      if (contract) {
        setTxStatus('📝 Confirm transaction in MetaMask...')
        const latE6 = gps ? Math.round(gps.lat * 1e6) : 0
        const lngE6 = gps ? Math.round(gps.lng * 1e6) : 0
        const tx = await contract.logEvent(
          selectedBatch.batch_id,
          config.nodeIndex,
          latE6, lngE6,
          form.locationName || '',
          form.notes,
          ''
        )
        setTxStatus('⏳ Waiting for confirmation...')
        const receipt = await tx.wait()
        txHash = receipt.hash
        setTxStatus('✅ Confirmed!')
      }

      // Database write
      const res = await authFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({
          batchId: selectedBatch.batch_id,
          nodeType: user.role,
          latitude: gps?.lat || null,
          longitude: gps?.lng || null,
          locationName: form.locationName || null,
          notes: form.notes,
          txHash
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(true)
      setTxStatus('')
    } catch (err) {
      setError(err.message)
      setTxStatus('')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto px-4 py-10 text-center">
        <div className="card">
          <div className="text-5xl mb-3">✅</div>
          <h2 className="font-display text-2xl font-bold text-forest mb-2">Event Logged!</h2>
          <p className="text-gray-500 mb-4">Your supply chain event has been recorded on the blockchain.</p>
          <div className="flex gap-3 justify-center">
            <a href={`/verify/${selectedBatch?.batch_id}`} className="btn-primary text-sm">View Journey</a>
            <button onClick={() => { setSuccess(false); setSelectedBatch(null); setForm({ notes:'', locationName:'' }); setGps(null) }} className="btn-secondary text-sm">
              Log Another
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-forest mb-1">
        {config.icon} {config.label} Event
      </h1>
      <p className="text-gray-500 text-sm mb-6">Log your supply chain activity for a herb batch</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {txStatus && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">{txStatus}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Batch selector */}
        <div>
          <label className="label">Select Batch</label>
          {batches.length === 0 ? (
            <div className="card text-center text-gray-400 py-6">
              <p>No active batches found.</p>
              <p className="text-xs mt-1">Wait for a collector to create batches.</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {batches.map(b => (
                <button
                  type="button"
                  key={b.id}
                  onClick={() => setSelectedBatch(b)}
                  className={`w-full text-left p-3 border-2 rounded-lg text-sm transition-all ${
                    selectedBatch?.id === b.id ? 'border-forest bg-pale' : 'border-gray-200 hover:border-sage'
                  }`}
                >
                  <div className="font-semibold text-forest">{b.herb_name}</div>
                  <div className="font-mono text-xs text-gray-500">{b.batch_id}</div>
                  <div className="text-xs text-gray-400">{b.quantity_kg} kg · Status: {b.status}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedBatch && (
          <>
            {/* GPS */}
            <div>
              <label className="label">Your Location (optional)</label>
              {gps ? (
                <div className="bg-pale rounded-lg p-2 text-xs text-gray-600 font-mono">
                  ✅ {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
                </div>
              ) : (
                <button type="button" onClick={getGPS} className="btn-secondary w-full text-sm">
                  📍 Capture Location
                </button>
              )}
              <input
                className="input mt-2"
                placeholder="Location name (e.g., Bengaluru Processing Unit)"
                value={form.locationName}
                onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))}
              />
            </div>

            {/* Notes */}
            <div>
              <label className="label">Activity Notes <span className="text-red-500">*</span></label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder={config.placeholder}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                required
              />
            </div>

            <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
              {loading ? txStatus || 'Processing...' : `⛓ Log ${config.label} Event`}
            </button>
          </>
        )}
      </form>
    </div>
  )
}
