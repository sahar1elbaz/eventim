import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

const CATEGORIES = [
  { table: 'equipment_items', label: '🎒 ציוד', hasQuantity: true },
  { table: 'shopping_items', label: '🛒 קניות', hasQuantity: true },
  { table: 'menu_items', label: '🍽️ תפריט', hasQuantity: false },
]

/**
 * One global add bar for all three item lists, replacing the three separate
 * inline forms that used to live inside each ItemListSection:
 * - paste/type several items (newline or comma separated) and add them all at once
 * - tap a suggested item (from recently-added items in events you're in) to add it instantly
 */
export default function QuickAddBar({ event, members, onAdded }) {
  const { user } = useAuth()
  const [category, setCategory] = useState(CATEGORIES[0])
  const [text, setText] = useState('')
  const [quantity, setQuantity] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [suggestions, setSuggestions] = useState([])
  const [adding, setAdding] = useState(false)
  const [error, setError] = useState(null)

  async function loadSuggestions() {
    const { data, error } = await supabase
      .from(category.table)
      .select('name')
      .order('created_at', { ascending: false })
      .limit(200)
    if (error) return
    const seen = new Set()
    const out = []
    for (const row of data) {
      if (!seen.has(row.name)) {
        seen.add(row.name)
        out.push(row.name)
      }
      if (out.length >= 10) break
    }
    setSuggestions(out)
  }

  useEffect(() => {
    loadSuggestions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category.table])

  function splitItems(raw) {
    return raw
      .split(/[\n,]/)
      .map((s) => s.trim())
      .filter(Boolean)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const names = splitItems(text)
    if (names.length === 0) return
    setAdding(true)
    setError(null)

    const rows = names.map((name) => {
      const row = { event_id: event.id, name, assigned_to: assignedTo || null, created_by: user.id }
      if (category.hasQuantity) row.quantity = quantity.trim() || null
      return row
    })

    const { error } = await supabase.from(category.table).insert(rows)
    setAdding(false)
    if (error) {
      setError(error.message)
    } else {
      setText('')
      setQuantity('')
      setAssignedTo('')
      onAdded(category.table)
      loadSuggestions()
    }
  }

  async function handleTapSuggestion(name) {
    setError(null)
    const { error } = await supabase.from(category.table).insert({ event_id: event.id, name, created_by: user.id })
    if (error) setError(error.message)
    else onAdded(category.table)
  }

  return (
    <section className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <h2>➕ הוספה מהירה</h2>

      <div className="row" style={{ marginBottom: 'var(--space-2)' }}>
        {CATEGORIES.map((c) => (
          <button
            key={c.table}
            type="button"
            onClick={() => setCategory(c)}
            className={category.table === c.table ? 'btn-primary' : ''}
          >
            {c.label}
          </button>
        ))}
      </div>

      {suggestions.length > 0 && (
        <div className="row" style={{ marginBottom: 'var(--space-2)' }}>
          {suggestions.map((name) => (
            <button key={name} type="button" onClick={() => handleTapSuggestion(name)} className="badge btn-ghost btn-sm">
              + {name}
            </button>
          ))}
        </div>
      )}

      {error && <p className="text-danger text-small">{error}</p>}

      <form onSubmit={handleSubmit} className="stack">
        <textarea
          placeholder={'שם פריט אחד, או כמה פריטים כל אחד בשורה נפרדת (או מופרדים בפסיק)'}
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
        />
        <div className="row">
          {category.hasQuantity && (
            <input
              type="text"
              placeholder="כמות (רשות — חלה על כל הפריטים שמוזנים ביחד)"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              style={{ flex: '1 1 180px' }}
            />
          )}
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={{ flex: '1 1 140px' }}>
            <option value="">לא שויך</option>
            {members.map((m) => (
              <option key={m.user_id} value={m.user_id}>
                {m.full_name || m.email}
              </option>
            ))}
          </select>
          <button type="submit" disabled={adding} className="btn-primary">
            הוסף +
          </button>
        </div>
      </form>
    </section>
  )
}
