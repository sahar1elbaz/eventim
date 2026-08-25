import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function EditEventModal({ event, onClose, onSaved, onDeleted }) {
  const [name, setName] = useState(event.name || '')
  const [eventType, setEventType] = useState(event.event_type || '')
  const [startsAt, setStartsAt] = useState(event.starts_at || '')
  const [endsAt, setEndsAt] = useState(event.ends_at || '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  async function handleSave(e) {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    setError(null)
    const { data, error } = await supabase
      .from('events')
      .update({
        name: name.trim(),
        event_type: eventType.trim() || null,
        starts_at: startsAt || null,
        ends_at: endsAt || null,
      })
      .eq('id', event.id)
      .select()
      .single()
    setSaving(false)
    if (error) setError(error.message)
    else onSaved(data)
  }

  async function handleDelete() {
    if (!window.confirm(`למחוק את האירוע "${event.name}" לצמיתות? כל הציוד/קניות/תפריט שלו יימחקו גם הם.`)) {
      return
    }
    setDeleting(true)
    setError(null)
    const { error } = await supabase.from('events').delete().eq('id', event.id)
    setDeleting(false)
    if (error) setError(error.message)
    else onDeleted()
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '2rem 1rem',
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: 'white',
          borderRadius: 8,
          padding: '1.25rem',
          maxWidth: 420,
          width: '100%',
          direction: 'rtl',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ margin: 0 }}>עריכת פרטי אירוע</h2>
          <button onClick={onClose}>סגור ✕</button>
        </div>

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '0.75rem' }}>
          <label>
            שם האירוע
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required style={{ width: '100%' }} />
          </label>

          <label>
            סוג אירוע (חופשי, למשל: קמפינג, יום הולדת)
            <input type="text" value={eventType} onChange={(e) => setEventType(e.target.value)} style={{ width: '100%' }} />
          </label>

          <label>
            תאריך התחלה
            <input type="date" value={startsAt || ''} onChange={(e) => setStartsAt(e.target.value)} style={{ width: '100%' }} />
          </label>

          <label>
            תאריך סיום
            <input type="date" value={endsAt || ''} onChange={(e) => setEndsAt(e.target.value)} style={{ width: '100%' }} />
          </label>

          {error && <p style={{ color: 'crimson' }}>{error}</p>}

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button type="submit" disabled={saving}>
              {saving ? 'שומר...' : 'שמירה'}
            </button>
            <button type="button" onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>

        <hr style={{ margin: '1rem 0' }} />

        <button onClick={handleDelete} disabled={deleting} style={{ color: 'crimson' }}>
          {deleting ? 'מוחק...' : 'מחיקת אירוע לצמיתות'}
        </button>
      </div>
    </div>
  )
}
