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
    <div className="modal-overlay">
      <div className="modal modal-narrow">
        <div className="row-between">
          <h2>עריכת פרטי אירוע</h2>
          <button onClick={onClose} className="btn-ghost btn-sm">
            סגור ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="stack" style={{ marginTop: 'var(--space-3)' }}>
          <label>
            שם האירוע
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
          </label>

          <label>
            סוג אירוע (חופשי, למשל: קמפינג, יום הולדת)
            <input type="text" value={eventType} onChange={(e) => setEventType(e.target.value)} />
          </label>

          <div className="row">
            <label style={{ flex: 1 }}>
              תאריך התחלה
              <input type="date" value={startsAt || ''} onChange={(e) => setStartsAt(e.target.value)} />
            </label>

            <label style={{ flex: 1 }}>
              תאריך סיום
              <input type="date" value={endsAt || ''} onChange={(e) => setEndsAt(e.target.value)} />
            </label>
          </div>

          {error && <p className="text-danger text-small">{error}</p>}

          <div className="row" style={{ marginTop: 'var(--space-1)' }}>
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? 'שומר...' : 'שמירה'}
            </button>
            <button type="button" onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>

        <hr className="divider" />

        <button onClick={handleDelete} disabled={deleting} className="btn-danger">
          {deleting ? 'מוחק...' : 'מחיקת אירוע לצמיתות'}
        </button>
      </div>
    </div>
  )
}
