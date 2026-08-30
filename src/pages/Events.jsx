import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function Events({ onOpenEvent }) {
  const { user, signOut } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)

  const [joinNumber, setJoinNumber] = useState('')
  const [joining, setJoining] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email

  async function loadEvents() {
    setLoading(true)
    setError(null)
    // RLS already filters to events the user is a member of — no client-side filtering needed.
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setEvents(data)
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
  }, [])

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError(null)
    const { error } = await supabase.rpc('create_event', { p_name: newName.trim() })
    setCreating(false)
    if (error) {
      setError(error.message)
    } else {
      setNewName('')
      await loadEvents()
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (!joinNumber.trim()) return
    setJoining(true)
    setError(null)
    const { error } = await supabase.rpc('join_event', { p_event_number: joinNumber.trim() })
    setJoining(false)
    if (error) {
      setError(error.message)
    } else {
      setJoinNumber('')
      await loadEvents()
    }
  }

  return (
    <div className="page">
      <div className="container">
        <div className="topbar">
          <div className="row">
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: 'var(--color-primary)',
                color: 'var(--color-primary-contrast)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {(displayName || '?').charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 style={{ marginBottom: 0 }}>האירועים שלי</h1>
              <span className="text-muted text-small">{displayName}</span>
            </div>
          </div>
          <button onClick={signOut} className="btn-ghost btn-sm">
            התנתקות
          </button>
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <form onSubmit={handleCreate} className="row" style={{ marginBottom: 'var(--space-3)' }}>
            <input
              type="text"
              placeholder="שם אירוע חדש"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              style={{ flex: 1, minWidth: 160 }}
            />
            <button type="submit" disabled={creating} className="btn-primary">
              אירוע חדש +
            </button>
          </form>

          <form onSubmit={handleJoin} className="row">
            <input
              type="text"
              placeholder="מספר אירוע להצטרפות"
              value={joinNumber}
              onChange={(e) => setJoinNumber(e.target.value)}
              style={{ flex: 1, minWidth: 160 }}
            />
            <button type="submit" disabled={joining}>
              הצטרף לאירוע
            </button>
          </form>
        </div>

        {error && <p className="text-danger text-small">{error}</p>}

        {loading ? (
          <p className="text-muted">טוען...</p>
        ) : events.length === 0 ? (
          <div className="card text-muted" style={{ textAlign: 'center' }}>
            אין עדיין אירועים. צור/י אירוע חדש או הצטרף/י לאחד קיים.
          </div>
        ) : (
          <ul className="plain">
            {events.map((ev) => (
              <li
                key={ev.id}
                onClick={() => onOpenEvent(ev)}
                className="card"
                style={{ marginBottom: 'var(--space-2)', cursor: 'pointer' }}
              >
                <div className="row-between">
                  <strong>{ev.name}</strong>
                  {ev.event_type && <span className="badge badge-primary">{ev.event_type}</span>}
                </div>
                <div className="text-muted text-small">
                  מספר אירוע: {ev.event_number}
                  {ev.starts_at ? ` · ${ev.starts_at}${ev.ends_at ? ` – ${ev.ends_at}` : ''}` : ''}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
