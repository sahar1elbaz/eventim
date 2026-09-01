import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import DateRangePicker from './DateRangePicker'

export default function EditEventModal({ event, onClose, onSaved, onDeleted }) {
  const isOpen = event.status === 'open'
  const [name, setName] = useState(event.name || '')
  const [eventType, setEventType] = useState(event.event_type || '')
  const [startsAt, setStartsAt] = useState(event.starts_at || '')
  const [endsAt, setEndsAt] = useState(event.ends_at || '')
  const [adultsCount, setAdultsCount] = useState(event.adults_count ?? '')
  const [childrenCount, setChildrenCount] = useState(event.children_count ?? '')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [togglingStatus, setTogglingStatus] = useState(false)

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
        adults_count: adultsCount === '' ? null : Number(adultsCount),
        children_count: childrenCount === '' ? null : Number(childrenCount),
      })
      .eq('id', event.id)
      .select()
      .single()
    setSaving(false)
    if (error) setError(error.message)
    else onSaved(data)
  }

  async function handleToggleStatus() {
    const nextStatus = event.status === 'cancelled' ? 'open' : 'cancelled'
    setTogglingStatus(true)
    setError(null)
    const { data, error } = await supabase.rpc('set_event_status', {
      p_event_id: event.id,
      p_status: nextStatus,
    })
    setTogglingStatus(false)
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

        {!isOpen && (
          <p className="text-muted text-small" style={{ marginTop: 'var(--space-2)' }}>
            האירוע אינו פעיל (סטטוס: {event.status === 'finished' ? 'הסתיים' : 'בוטל'}) — פרטיו נעולים לעריכה. אפשר
            להוסיף תגובה במסך האירוע, או לשחזר אותו לפתוח למטה.
          </p>
        )}

        <form onSubmit={handleSave} className="stack" style={{ marginTop: 'var(--space-3)' }}>
          <fieldset disabled={!isOpen} style={{ border: 'none', padding: 0, margin: 0 }}>
            <div className="stack">
              <label>
                שם האירוע
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
              </label>

              <label>
                סוג אירוע (חופשי, למשל: קמפינג, יום הולדת)
                <input type="text" value={eventType} onChange={(e) => setEventType(e.target.value)} />
              </label>

              <div>
                <label>טווח תאריכים</label>
                <div className="card" style={{ padding: 'var(--space-3)' }}>
                  <DateRangePicker
                    startValue={startsAt}
                    endValue={endsAt}
                    onChange={({ start, end }) => {
                      setStartsAt(start)
                      setEndsAt(end)
                    }}
                  />
                </div>
              </div>

              <div className="row">
                <label style={{ flex: 1 }}>
                  מבוגרים
                  <input type="number" min="0" value={adultsCount} onChange={(e) => setAdultsCount(e.target.value)} />
                </label>
                <label style={{ flex: 1 }}>
                  ילדים
                  <input type="number" min="0" value={childrenCount} onChange={(e) => setChildrenCount(e.target.value)} />
                </label>
              </div>
            </div>
          </fieldset>

          {error && <p className="text-danger text-small">{error}</p>}

          <div className="row" style={{ marginTop: 'var(--space-1)' }}>
            {isOpen && (
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? 'שומר...' : 'שמירה'}
              </button>
            )}
            <button type="button" onClick={onClose}>
              ביטול
            </button>
          </div>
        </form>

        <hr className="divider" />

        <button onClick={handleToggleStatus} disabled={togglingStatus} style={{ width: '100%', marginBottom: 'var(--space-2)' }}>
          {togglingStatus ? '...' : event.status === 'cancelled' ? 'שחזור האירוע' : 'ביטול האירוע'}
        </button>

        <button onClick={handleDelete} disabled={deleting} className="btn-danger" style={{ width: '100%' }}>
          {deleting ? 'מוחק...' : 'מחיקת אירוע לצמיתות'}
        </button>
      </div>
    </div>
  )
}
