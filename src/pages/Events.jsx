import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import CreateEventWizard from '../components/CreateEventWizard'

export default function Events({ onOpenEvent }) {
  const { user, signOut } = useAuth()
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showClosed, setShowClosed] = useState(false)
  const [showWizard, setShowWizard] = useState(false)

  const [joinNumber, setJoinNumber] = useState('')
  const [joining, setJoining] = useState(false)

  const displayName = user?.user_metadata?.full_name || user?.email

  async function loadEvents() {
    setLoading(true)
    setError(null)
    // RLS already filters to events the user is a member of — no client-side filtering needed
    // beyond the open/closed toggle, which is a display preference, not a security boundary.
    let query = supabase.from('events').select('*').order('created_at', { ascending: false })
    if (!showClosed) query = query.eq('status', 'open')

    const { data, error } = await query
    if (error) setError(error.message)
    else setEvents(data)
    setLoading(false)
  }

  useEffect(() => {
    loadEvents()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showClosed])

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
              <h1 style={{ marginBottom: 0 }}>האירועים הפתוחים שלי</h1>
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

        {error && <p className="text-danger text-small">{error}</p>}

        {loading ? (
          <p className="text-muted">טוען...</p>
        ) : events.length === 0 ? (
          <div className="card text-muted" style={{ textAlign: 'center' }}>
            {showClosed ? 'אין אירועים.' : 'אין עדיין אירועים פתוחים. צור/י אירוע חדש או הצטרף/י לאחד קיים.'}
          </div>
        ) : (
          <ul className="plain">
            {events.map((ev) => (
              <li
                key={ev.id}
                onClick={() => onOpenEvent(ev)}
                className="card"
                style={{ marginBottom: 'var(--space-2)', cursor: 'pointer', opacity: ev.status === 'closed' ? 0.6 : 1 }}
              >
                <div className="row-between">
                  <strong>{ev.name}</strong>
                  <div className="row" style={{ width: 'auto' }}>
                    {ev.status === 'closed' && <span className="badge">סגור</span>}
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
            ))}
          </ul>
        )}

        <button onClick={() => setShowClosed((v) => !v)} className="btn-ghost btn-sm" style={{ marginTop: 'var(--space-3)' }}>
          {showClosed ? 'הסתר אירועים סגורים' : 'הצג גם אירועים סגורים'}
        </button>

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
