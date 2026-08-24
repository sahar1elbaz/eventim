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
    <div style={{ maxWidth: 480, margin: '2rem auto', direction: 'rtl', fontFamily: 'sans-serif' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>האירועים שלי</h1>
        <button onClick={signOut} style={{ cursor: 'pointer' }}>
          התנתקות
        </button>
      </div>
      <p style={{ color: '#666' }}>מחובר/ת כ: {user?.email ?? user?.user_metadata?.full_name}</p>

      <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          type="text"
          placeholder="שם אירוע חדש"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={creating}>
          אירוע חדש +
        </button>
      </form>

      <form onSubmit={handleJoin} style={{ display: 'flex', gap: '0.5rem', margin: '1rem 0' }}>
        <input
          type="text"
          placeholder="מספר אירוע להצטרפות"
          value={joinNumber}
          onChange={(e) => setJoinNumber(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={joining}>
          הצטרף לאירוע
        </button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {loading ? (
        <p>טוען...</p>
      ) : events.length === 0 ? (
        <p>אין עדיין אירועים. צור/י אירוע חדש או הצטרף/י לאחד קיים.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {events.map((ev) => (
            <li
              key={ev.id}
              onClick={() => onOpenEvent(ev)}
              style={{
                border: '1px solid #ddd',
                borderRadius: 6,
                padding: '0.75rem',
                marginBottom: '0.5rem',
                cursor: 'pointer',
              }}
            >
              <strong>{ev.name}</strong>
              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                מספר אירוע: {ev.event_number}
                {ev.event_type ? ` · סוג: ${ev.event_type}` : ''}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
