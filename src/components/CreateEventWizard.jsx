import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import WizardExcelStep from './WizardExcelStep'
import DateRangePicker from './DateRangePicker'

const EVENT_TYPE_SUGGESTIONS = ['קמפינג', 'יום הולדת', 'טיול', 'חתונה', 'מפגש משפחתי', 'אחר']

const STEP_TITLES = ['פרטי אירוע', 'משתתפים', 'ייבוא מ-Excel (רשות)', 'סיכום ואישור']

export default function CreateEventWizard({ onClose, onCreated }) {
  const [step, setStep] = useState(1)

  const [name, setName] = useState('')
  const [numberMode, setNumberMode] = useState('auto') // 'auto' | 'custom'
  const [customNumber, setCustomNumber] = useState('')
  const [eventType, setEventType] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')

  const [adultsCount, setAdultsCount] = useState('')
  const [childrenCount, setChildrenCount] = useState('')

  const [stagedItems, setStagedItems] = useState({ equipment_items: [], shopping_items: [], menu_items: [] })

  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function handleStage(table, items) {
    setStagedItems((prev) => ({ ...prev, [table]: [...prev[table], ...items] }))
  }

  const step1Valid = name.trim().length > 0 && (numberMode === 'auto' || customNumber.trim().length > 0)
  const dateRangeValid = !startsAt || !endsAt || startsAt <= endsAt

  function goNext() {
    setError(null)
    if (step === 1 && !step1Valid) return
    if (step === 1 && !dateRangeValid) {
      setError('תאריך הסיום לא יכול להיות לפני תאריך ההתחלה')
      return
    }
    setStep((s) => Math.min(s + 1, 4))
  }

  function goBack() {
    setError(null)
    setStep((s) => Math.max(s - 1, 1))
  }

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)

    const { data: event, error: createErr } = await supabase.rpc('create_event', {
      p_name: name.trim(),
      p_event_number: numberMode === 'custom' ? customNumber.trim() : null,
    })

    if (createErr) {
      setSubmitting(false)
      if (createErr.message.includes('Event number already taken')) {
        setError('מספר האירוע הזה כבר תפוס — חזור/י לשלב 1 ובחר/י מספר אחר.')
      } else {
        setError(createErr.message)
      }
      return
    }

    const updates = {}
    if (eventType.trim()) updates.event_type = eventType.trim()
    if (startsAt) updates.starts_at = startsAt
    if (endsAt) updates.ends_at = endsAt
    if (adultsCount !== '') updates.adults_count = Number(adultsCount)
    if (childrenCount !== '') updates.children_count = Number(childrenCount)

    let finalEvent = event
    if (Object.keys(updates).length > 0) {
      const { data: updated, error: updateErr } = await supabase
        .from('events')
        .update(updates)
        .eq('id', event.id)
        .select()
        .single()
      if (updateErr) {
        setSubmitting(false)
        setError('האירוע נוצר, אך עדכון הפרטים נכשל: ' + updateErr.message)
        return
      }
      finalEvent = updated
    }

    for (const table of Object.keys(stagedItems)) {
      const items = stagedItems[table]
      if (items.length === 0) continue
      const rows = items.map((item) => {
        const row = { event_id: event.id, name: item.name, created_by: event.creator_id }
        const extraKey = table === 'menu_items' ? 'meal_type' : 'quantity'
        row[extraKey] = item.extra
        return row
      })
      const { error: insertErr } = await supabase.from(table).insert(rows)
      if (insertErr) {
        setSubmitting(false)
        setError(`האירוע נוצר, אך ייבוא הפריטים נכשל (${table}): ` + insertErr.message)
        return
      }
    }

    setSubmitting(false)
    onCreated(finalEvent)
  }

  const totalStaged = Object.values(stagedItems).reduce((sum, arr) => sum + arr.length, 0)

  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="row-between">
          <h2>
            אירוע חדש — שלב {step} מתוך 4: {STEP_TITLES[step - 1]}
          </h2>
          <button onClick={onClose} className="btn-ghost btn-sm">
            סגור ✕
          </button>
        </div>

        {error && <p className="text-danger text-small">{error}</p>}

        {step === 1 && (
          <div className="stack">
            <label>
              שם האירוע
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} required autoFocus />
            </label>

            <div>
              <label>מספר אירוע</label>
              <div className="row">
                <label className="row" style={{ width: 'auto' }}>
                  <input
                    type="radio"
                    name="numberMode"
                    checked={numberMode === 'auto'}
                    onChange={() => setNumberMode('auto')}
                    style={{ width: 18 }}
                  />
                  הגרלה אוטומטית
                </label>
                <label className="row" style={{ width: 'auto' }}>
                  <input
                    type="radio"
                    name="numberMode"
                    checked={numberMode === 'custom'}
                    onChange={() => setNumberMode('custom')}
                    style={{ width: 18 }}
                  />
                  בחירה ידנית
                </label>
              </div>
              {numberMode === 'custom' && (
                <input
                  type="text"
                  placeholder="לדוגמה: kinneret2026"
                  value={customNumber}
                  onChange={(e) => setCustomNumber(e.target.value)}
                  style={{ marginTop: 4 }}
                />
              )}
            </div>

            <label>
              סוג אירוע (רשות)
              <input
                type="text"
                list="event-type-suggestions"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="למשל: קמפינג"
              />
              <datalist id="event-type-suggestions">
                {EVENT_TYPE_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </label>

            <div>
              <label>טווח תאריכים (רשות)</label>
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
          </div>
        )}

        {step === 2 && (
          <div className="stack">
            <p className="text-muted text-small">כמות משתתפים משוערת (רשות — אפשר לעדכן מאוחר יותר).</p>
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
        )}

        {step === 3 && <WizardExcelStep staged={stagedItems} onStage={handleStage} />}

        {step === 4 && (
          <div className="stack">
            <div className="card">
              <p>
                <strong>{name}</strong>
              </p>
              <p className="text-muted text-small">
                מספר: {numberMode === 'custom' ? customNumber : 'יוגרל אוטומטית'}
                {eventType ? ` · סוג: ${eventType}` : ''}
                {startsAt ? ` · ${startsAt}${endsAt ? ` – ${endsAt}` : ''}` : ''}
              </p>
              {(adultsCount !== '' || childrenCount !== '') && (
                <p className="text-muted text-small">
                  משתתפים: {adultsCount || 0} מבוגרים, {childrenCount || 0} ילדים
                </p>
              )}
              <p className="text-muted text-small">פריטים לייבוא: {totalStaged}</p>
            </div>
            <p className="text-small">לחיצה על "פתיחת האירוע" תיצור את האירוע בפועל.</p>
          </div>
        )}

        <div className="row" style={{ marginTop: 'var(--space-4)' }}>
          {step > 1 && (
            <button onClick={goBack} disabled={submitting}>
              → חזרה
            </button>
          )}
          {step < 4 && (
            <button onClick={goNext} disabled={step === 1 && !step1Valid} className="btn-primary">
              הבא ←
            </button>
          )}
          {step === 4 && (
            <button onClick={handleConfirm} disabled={submitting} className="btn-primary">
              {submitting ? 'פותח אירוע...' : 'פתיחת האירוע'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
