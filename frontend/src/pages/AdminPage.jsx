import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function AdminPage() {
  const { authFetch } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authFetch('/api/stats')
      .then(r => r.json())
      .then(d => { setStats(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-forest">Loading stats...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="font-display text-2xl font-bold text-forest mb-6">⚙️ Admin Dashboard</h1>

      {/* Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Batches',    value: stats?.overview?.totalBatches || 0,    icon: '📦' },
          { label: 'Completed',         value: stats?.overview?.completedBatches || 0, icon: '✅' },
          { label: 'Total Events',      value: stats?.overview?.totalEvents || 0,      icon: '⛓' },
          { label: 'Registered Users',  value: stats?.overview?.totalUsers || 0,       icon: '👤' },
        ].map((s, i) => (
          <div key={i} className="card text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <div className="font-display text-3xl font-bold text-forest">{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Herbs distribution */}
        <div className="card">
          <h2 className="font-bold text-forest mb-4">🌿 Herbs Traced</h2>
          {(stats?.herbsDistribution || []).length === 0 ? (
            <p className="text-gray-400 text-sm">No batches yet</p>
          ) : (
            <div className="space-y-3">
              {stats.herbsDistribution.map((h, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-20 text-sm font-semibold text-forest truncate">{h.name}</div>
                  <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div
                      className="h-full bg-moss rounded-full transition-all"
                      style={{ width: `${Math.min(100, (h.count / Math.max(...stats.herbsDistribution.map(x => x.count))) * 100)}%` }}
                    />
                  </div>
                  <div className="w-8 text-right text-sm font-bold text-forest">{h.count}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Node activity */}
        <div className="card">
          <h2 className="font-bold text-forest mb-4">📊 Node Activity</h2>
          {['collector','aggregator','processor','manufacturer'].map(node => {
            const count = stats?.nodeActivity?.[node] || 0
            const maxCount = Math.max(...Object.values(stats?.nodeActivity || {}), 1)
            const icons = { collector:'🌿', aggregator:'📦', processor:'⚗️', manufacturer:'🏭' }
            return (
              <div key={node} className="flex items-center gap-3 mb-3">
                <span className="text-lg">{icons[node]}</span>
                <div className="w-24 text-sm capitalize text-gray-600">{node}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${(count / maxCount) * 100}%`, background: '#c9a84c' }}
                  />
                </div>
                <div className="w-8 text-right text-sm font-bold text-forest">{count}</div>
              </div>
            )
          })}
        </div>

        {/* Recent batches */}
        <div className="card md:col-span-2">
          <h2 className="font-bold text-forest mb-4">📋 Recent Batches</h2>
          {(stats?.recentBatches || []).length === 0 ? (
            <p className="text-gray-400 text-sm">No batches yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500 text-xs uppercase tracking-wider">
                    <th className="pb-2 pr-4">Batch ID</th>
                    <th className="pb-2 pr-4">Herb</th>
                    <th className="pb-2 pr-4">Qty</th>
                    <th className="pb-2 pr-4">Status</th>
                    <th className="pb-2">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentBatches.map((b, i) => (
                    <tr key={i} className="border-b last:border-0 hover:bg-pale transition-colors">
                      <td className="py-2 pr-4 font-mono text-xs text-gray-500">{b.batch_id?.slice(0, 20)}...</td>
                      <td className="py-2 pr-4 font-semibold text-forest">{b.herb_name}</td>
                      <td className="py-2 pr-4">{b.quantity_kg} kg</td>
                      <td className="py-2 pr-4">
                        <span className={`badge ${b.status === 'completed' ? 'badge-completed' : 'badge-active'} capitalize`}>
                          {b.status}
                        </span>
                      </td>
                      <td className="py-2 text-xs text-gray-400">{new Date(b.created_at).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Completion rate */}
      {stats?.overview?.totalBatches > 0 && (
        <div className="card mt-6">
          <div className="flex justify-between mb-2">
            <span className="font-bold text-forest">Supply Chain Completion Rate</span>
            <span className="font-bold text-moss">{stats.overview.completionRate}%</span>
          </div>
          <div className="bg-gray-100 rounded-full h-5 overflow-hidden">
            <div
              className="h-full bg-moss rounded-full transition-all"
              style={{ width: `${stats.overview.completionRate}%` }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {stats.overview.completedBatches} of {stats.overview.totalBatches} batches reached the final label stage
          </p>
        </div>
      )}
    </div>
  )
}
