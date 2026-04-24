import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useBlockchain } from '../context/BlockchainContext'

const HERBS = [
  { name: 'Ashwagandha', latin: 'Withania somnifera', sanskrit: 'अश्वगंधा' },
  { name: 'Tulsi',        latin: 'Ocimum tenuiflorum',  sanskrit: 'तुलसी' },
  { name: 'Brahmi',       latin: 'Bacopa monnieri',     sanskrit: 'ब्राह्मी' },
  { name: 'Neem',         latin: 'Azadirachta indica',  sanskrit: 'निम्ब' },
  { name: 'Turmeric',     latin: 'Curcuma longa',       sanskrit: 'हल्दी' },
  { name: 'Ginger',       latin: 'Zingiber officinale', sanskrit: 'अदरक' },
]

export default function CollectorPage() {
  const { user, authFetch } = useAuth()
  const { contract, account } = useBlockchain()
  const navigate = useNavigate()
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  const [form, setForm] = useState({
    herbName: '', herbLatin: '', quantityKg: '',
    locationName: '', notes: ''
  })
  const [gps, setGps] = useState(null)
  const [gpsLoading, setGpsLoading] = useState(false)
  const [photo, setPhoto] = useState(null) // base64
  const [cameraOn, setCameraOn] = useState(false)
  const [loading, setLoading] = useState(false)
  const [txStatus, setTxStatus] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)

  const selectHerb = (herb) => {
    setForm(f => ({ ...f, herbName: herb.name, herbLatin: herb.latin }))
  }

  const getGPS = () => {
    setGpsLoading(true)
    setError('')
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser')
      setGpsLoading(false)
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy })
        setGpsLoading(false)
      },
      (err) => {
        setError('GPS failed: ' + err.message)
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 }
    )
  }

  const openCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
        setCameraOn(true)
      }
    } catch {
      setError('Camera access denied. Please allow camera permission.')
    }
  }

  const capturePhoto = () => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video) return
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d').drawImage(video, 0, 0)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
    setPhoto(dataUrl)
    // Stop camera
    video.srcObject?.getTracks().forEach(t => t.stop())
    setCameraOn(false)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.herbName || !form.quantityKg) {
      setError('Please fill herb name and quantity')
      return
    }
    if (!gps) {
      setError('Please capture GPS location first')
      return
    }
    setLoading(true)
    setError('')
    setTxStatus('Creating batch...')

    try {
      let txHash = null

      // Step 1: Write to blockchain if contract is available
      if (contract && account) {
        setTxStatus('📝 Writing to blockchain... (confirm in MetaMask)')
        const batchId = `HERB-${Date.now()}-${Math.random().toString(36).substr(2,6).toUpperCase()}`
        const latE6 = Math.round(gps.lat * 1e6)
        const lngE6 = Math.round(gps.lng * 1e6)
        const quantityGrams = Math.round(parseFloat(form.quantityKg) * 1000)

        const tx = await contract.createBatch(
          batchId,
          form.herbName,
          form.herbLatin || '',
          quantityGrams,
          latE6,
          lngE6,
          form.locationName || `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
          form.notes || '',
          '' // photoHash - would be IPFS CID in production
        )
        setTxStatus('⏳ Waiting for confirmation...')
        const receipt = await tx.wait()
        txHash = receipt.hash
        setTxStatus('✅ Blockchain confirmed!')
      } else {
        setTxStatus('📝 Saving to database (no blockchain connected)...')
      }

      // Step 2: Save to backend/database
      const res = await authFetch('/api/batches', {
        method: 'POST',
        body: JSON.stringify({
          herbName: form.herbName,
          herbLatin: form.herbLatin,
          quantityKg: parseFloat(form.quantityKg),
          latitude: gps.lat,
          longitude: gps.lng,
          locationName: form.locationName || `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}`,
          notes: form.notes,
          photoUrl: photo,
          txHash
        })
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error)

      setSuccess(data)
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
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="font-display text-2xl font-bold text-forest mb-2">Batch Created!</h2>
          <p className="text-gray-500 text-sm mb-4">Your herb collection has been recorded on the blockchain.</p>
          <div className="bg-pale rounded-lg p-3 mb-4 text-left">
            <div className="text-xs font-semibold text-forest mb-1">Batch ID</div>
            <div className="font-mono text-sm break-all">{success.batchId}</div>
            {success.batch?.tx_hash && (
              <>
                <div className="text-xs font-semibold text-forest mt-2 mb-1">Transaction Hash</div>
                <div className="font-mono text-xs text-gray-600 break-all">{success.batch.tx_hash}</div>
              </>
            )}
          </div>
          {success.qrCode && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 mb-2">QR Code for Consumer Verification</p>
              <img src={success.qrCode} alt="QR Code" className="mx-auto w-40 h-40 border rounded-lg" />
              <a download={`qr-${success.batchId}.png`} href={success.qrCode} className="text-xs text-moss hover:underline block mt-1">
                Download QR
              </a>
            </div>
          )}
          <div className="flex gap-3 justify-center">
            <a href={`/verify/${success.batchId}`} className="btn-primary text-sm">View Journey</a>
            <button onClick={() => { setSuccess(null); setForm({ herbName:'', herbLatin:'', quantityKg:'', locationName:'', notes:'' }); setGps(null); setPhoto(null) }} className="btn-secondary text-sm">New Batch</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-forest mb-1">🌿 Log Herb Collection</h1>
      <p className="text-gray-500 text-sm mb-6">Record a new herb batch with GPS and photo evidence</p>

      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>}
      {txStatus && <div className="bg-blue-50 border border-blue-200 text-blue-700 px-4 py-3 rounded-lg mb-4 text-sm">{txStatus}</div>}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Herb selection */}
        <div>
          <label className="label">Select Herb</label>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {HERBS.map(h => (
              <button
                type="button"
                key={h.name}
                onClick={() => selectHerb(h)}
                className={`text-left p-2.5 border-2 rounded-lg text-sm transition-all ${
                  form.herbName === h.name ? 'border-forest bg-pale' : 'border-gray-200 hover:border-sage'
                }`}
              >
                <div className="font-semibold text-forest">{h.name}</div>
                <div className="text-xs text-gray-500">{h.sanskrit}</div>
              </button>
            ))}
          </div>
          <input
            className="input"
            placeholder="Or type herb name..."
            value={form.herbName}
            onChange={e => setForm(f => ({ ...f, herbName: e.target.value }))}
          />
        </div>

        {/* Quantity */}
        <div>
          <label className="label">Quantity (kg)</label>
          <input
            type="number"
            step="0.1"
            min="0.1"
            className="input"
            placeholder="e.g., 5.5"
            value={form.quantityKg}
            onChange={e => setForm(f => ({ ...f, quantityKg: e.target.value }))}
            required
          />
        </div>

        {/* GPS */}
        <div>
          <label className="label">GPS Location</label>
          {gps ? (
            <div className="bg-pale rounded-lg p-3 text-sm">
              <div className="text-green-700 font-semibold">✅ Location captured</div>
              <div className="text-gray-600 font-mono text-xs mt-1">
                {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
                {gps.accuracy && <span className="ml-2 text-gray-400">(±{Math.round(gps.accuracy)}m)</span>}
              </div>
              <button type="button" onClick={getGPS} className="text-xs text-forest hover:underline mt-1">Refresh</button>
            </div>
          ) : (
            <button
              type="button"
              onClick={getGPS}
              disabled={gpsLoading}
              className="btn-secondary w-full"
            >
              {gpsLoading ? '📍 Getting location...' : '📍 Capture GPS Location'}
            </button>
          )}
          <input
            className="input mt-2"
            placeholder="Location name (e.g., Mysuru Forest, Karnataka)"
            value={form.locationName}
            onChange={e => setForm(f => ({ ...f, locationName: e.target.value }))}
          />
        </div>

        {/* Photo */}
        <div>
          <label className="label">Photo Evidence</label>
          {photo ? (
            <div className="relative">
              <img src={photo} alt="Captured" className="w-full h-40 object-cover rounded-lg border" />
              <button
                type="button"
                onClick={() => setPhoto(null)}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-6 h-6 text-xs flex items-center justify-center"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {cameraOn ? (
                <div className="relative">
                  <video ref={videoRef} className="w-full rounded-lg" autoPlay playsInline />
                  <canvas ref={canvasRef} className="hidden" />
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white rounded-full w-14 h-14 text-2xl shadow-lg flex items-center justify-center"
                  >
                    📷
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <button type="button" onClick={openCamera} className="btn-secondary flex-1 text-sm">
                    📷 Open Camera
                  </button>
                  <label className="btn-secondary flex-1 text-sm text-center cursor-pointer">
                    📁 Upload Photo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={e => {
                        const file = e.target.files[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = ev => setPhoto(ev.target.result)
                        reader.readAsDataURL(file)
                      }}
                    />
                  </label>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="label">Notes</label>
          <textarea
            className="input resize-none"
            rows={3}
            placeholder="Collection conditions, quality observations..."
            value={form.notes}
            onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          />
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full py-3 text-base">
          {loading ? txStatus || 'Processing...' : '⛓ Submit & Record on Blockchain'}
        </button>
      </form>
    </div>
  )
}
