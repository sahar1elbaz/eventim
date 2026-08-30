import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import CreateEventWizard from '../components/CreateEventWizard'

const STATUS_OPTIONS = [
  { value: 'open', label: 'פתוח' },
  { value: 'finished', label: 'הסתיים' },
  { value: 'cancelled', label: 'בוטל' },
]

function statusBadge(status) {
  if (status === 'finished') return { label: 'הסתיים', className: 'badge' }
  if (status === 'cancelled') return { label: 'בוטל', className: 'badge', style: { color: 'var(--color-danger)' } }
  return null
}

export default function Events({ onOpenEvent }) {
  const { user, signOut } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [statusFilter, setStatusFilter] = useState(['open', 'finished'])
  const [showWizard, setShowWizard] = useState(false)

  const [joinNumber, setJoinNumber] = useState('')
  const [joining, setJoining] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email

  async function loadEvents() {
    setLoading(true)
    setError(null)

    if (statusFilter.length === 0) {
      setEvents([])
      setLoading(false)
      return
    }

    // RLS already filters to events the user is a member of — the status filter here
    // is a display preference, not a security boundary.
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .in('status', statusFilter)
      .order('created_at', { ascending: false })

    if (error) setError(error.message)
    else setEvents(data)
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter])

  function toggleStatus(value) {
    setStatusFilter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
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
          <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
            <button onClick={() => setShowWizard(true)} className="btn-primary">
              אירוע חדש +
            </button>
          </div>

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

        <div className="row" style={{ marginBottom: 'var(--space-3)' }}>
          <span className="text-muted text-small">סינון לפי סטטוס:</span>
          {STATUS_OPTIONS.map((opt) => (
            <label key={opt.value} className="row" style={{ width: 'auto', gap: 4 }}>
              <input
                type="checkbox"
                checked={statusFilter.includes(opt.value)}
                onChange={() => toggleStatus(opt.value)}
                style={{ width: 16, height: 16 }}
              />
              <span className="text-small">{opt.label}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-danger text-small">{error}</p>}

        {loading ? (
          <p className="text-muted">טוען...</p>
        ) : events.length === 0 ? (
          <div className="card text-muted" style={{ textAlign: 'center' }}>
            אין אירועים התואמים את הסינון.
          </div>
        ) : (
          <ul className="plain">
            {events.map((ev) => {
              const badge = statusBadge(ev.status)
              return (
                <li
                  key={ev.id}
                  onClick={() => onOpenEvent(ev)}
                  className="card"
                  style={{ marginBottom: 'var(--space-2)', cursor: 'pointer', opacity: ev.status === 'cancelled' ? 0.6 : 1 }}
                >
                  <div className="row-between">
                    <strong>{ev.name}</strong>
                    <div className="row" style={{ width: 'auto' }}>
                      {badge && (
                        <span className={badge.className} style={badge.style}>
                          {badge.label}
                        </span>
                      )}
                      {ev.event_type && <span className="badge badge-primary">{ev.event_type}</span>}
                    </div>
                  </div>
                  <div className="text-muted text-small">
                    מספר אירוע: {ev.event_number}
                    {ev.starts_at ? ` · ${ev.starts_at}${ev.ends_at ? ` – ${ev.ends_at}` : ''}` : ''}
                    {ev.adults_count != null || ev.children_count != null
                      ? ` · ${ev.adults_count || 0} מבוגרים, ${ev.children_count || 0} ילדים`
                      : ''}
                  </div>
                </li>
              )
            })}
          </ul>
        )}

        {showWizard && (
          <CreateEventWizard
            onClose={() => setShowWizard(false)}
            onCreated={(event) => {
              setShowWizard(false)
              onOpenEvent(event)
            }}
          />
        )}
      </div>
    </div>
  )
}
