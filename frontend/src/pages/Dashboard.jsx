import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const STATUS_COLORS = {
  collected: 'badge-collector', aggregated: 'badge-aggregator',
  processed: 'badge-processor', completed: 'badge-completed',
  manufacturer: 'badge-manufacturer'
}

const NODE_ICONS = {
  collector: '🌿', aggregator: '📦', processor: '⚗️', manufacturer: '🏭'
}

export default function Dashboard() {
  const { user, authFetch } = useAuth()
  const [batches, setBatches] = useState([])
  const [recentEvents, setRecentEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [batchRes, eventsRes] = await Promise.all([
          authFetch('/api/batches'),
          authFetch('/api/events/recent')
        ])
        if (batchRes.ok) {
          const d = await batchRes.json()
          setBatches(d.batches || [])
        }
        if (eventsRes.ok) {
          const d = await eventsRes.json()
          setRecentEvents(d.events || [])
        }
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-forest text-lg">
      Loading dashboard...
    </div>
  )

  const completed = batches.filter(b => b.status === 'completed').length
  const active = batches.length - completed

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-forest">
            Welcome, {user?.name} {NODE_ICONS[user?.role] || ''}
          </h1>
          <p className="text-gray-500 text-sm mt-1 capitalize">Role: {user?.role}</p>
        </div>
        <div className="flex gap-3">
          {(user?.role === 'collector' || user?.role === 'admin') && (
            <Link to="/collect" className="btn-primary text-sm">+ New Batch</Link>
          )}
          {['aggregator','processor','manufacturer'].includes(user?.role) && (
            <Link to="/supply" className="btn-primary text-sm">+ Log Event</Link>
          )}
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Batches', value: batches.length, icon: '📦' },
          { label: 'Active', value: active, icon: '🔄' },
          { label: 'Completed', value: completed, icon: '✅' },
          { label: 'My Role', value: user?.role, icon: NODE_ICONS[user?.role] || '👤' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-display text-2xl font-bold text-forest">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Batches list */}
        <div>
          <h2 className="font-bold text-forest text-lg mb-3">Herb Batches</h2>
          {batches.length === 0 ? (
            <div className="card text-center text-gray-400 py-10">
              <div className="text-4xl mb-2">🌱</div>
              <p>No batches yet.</p>
              {(user?.role === 'collector' || user?.role === 'admin') && (
                <Link to="/collect" className="btn-primary mt-3 inline-block text-sm">Create First Batch</Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {batches.slice(0, 8).map(b => (
                <div key={b.id} className="card flex items-center justify-between hover:shadow-md transition-shadow">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-forest text-sm truncate">{b.herb_name}</div>
                    <div className="font-mono text-xs text-gray-400 truncate">{b.batch_id}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{b.quantity_kg} kg · {new Date(b.created_at).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2 ml-3">
                    <span className={`badge ${STATUS_COLORS[b.status] || 'badge-active'} capitalize`}>
                      {b.status}
                    </span>
                    <Link
                      to={`/verify/${b.batch_id}`}
                      className="text-xs text-moss hover:underline"
                    >
                      Verify →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent events feed */}
        <div>
          <h2 className="font-bold text-forest text-lg mb-3">Recent Activity</h2>
          {recentEvents.length === 0 ? (
            <div className="card text-center text-gray-400 py-10">
              <div className="text-4xl mb-2">📋</div>
              <p>No activity yet.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentEvents.slice(0, 8).map((e, i) => (
                <div key={i} className="card flex gap-3 items-start py-3">
                  <div className="text-xl mt-0.5">{NODE_ICONS[e.node_type] || '📍'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-forest capitalize">{e.node_type} logged</div>
                    <div className="text-xs text-gray-500 font-mono truncate">{e.batch_id}</div>
                    {e.batches?.herb_name && (
                      <div className="text-xs text-moss">{e.batches.herb_name}</div>
                    )}
                    <div className="text-xs text-gray-400 mt-0.5">by {e.actor_name}</div>
                  </div>
                  <div className="text-xs text-gray-400 whitespace-nowrap">
                    {new Date(e.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
