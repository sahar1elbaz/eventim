import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

/**
 * Generic list section for equipment / shopping / menu items.
 * All three tables share the same shape (event_id, name, quantity, assigned_to,
 * created_by, created_at) plus an optional boolean status field and an optional
 * extra text field (e.g. meal_type for the menu).
 */
export default function ItemListSection({
  table,
  event,
  members,
  title,
  statusField, // 'is_brought' | 'is_bought' | null
  statusLabel, // e.g. 'הובא'
  extraField, // { name, label, placeholder } | null
  hasQuantity = true,
}) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [extraValue, setExtraValue] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [adding, setAdding] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setItems(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [table, event.id])

  function memberName(userId) {
    if (!userId) return null
    const m = members.find((m) => m.user_id === userId)
    return m?.full_name || m?.email || 'משתמש'
  }

  async function handleAdd(e) {
    e.preventDefault()
    if (!name.trim()) return
    setAdding(true)
    setError(null)
    const row = {
      event_id: event.id,
      name: name.trim(),
      assigned_to: assignedTo || null,
      created_by: user.id,
    }
    if (hasQuantity) row.quantity = quantity.trim() || null
    if (extraField) row[extraField.name] = extraValue.trim() || null

    const { error } = await supabase.from(table).insert(row)
    setAdding(false)
    if (error) {
      setError(error.message)
    } else {
      setName('')
      setQuantity('')
      setExtraValue('')
      setAssignedTo('')
      await load()
    }
  }

  async function handleToggleStatus(item) {
    setError(null)
    const { error } = await supabase
      .from(table)
      .update({ [statusField]: !item[statusField] })
      .eq('id', item.id)
    if (error) setError(error.message)
    else load()
  }

  async function handleReassign(item, newUserId) {
    setError(null)
    const { error } = await supabase
      .from(table)
      .update({ assigned_to: newUserId || null })
      .eq('id', item.id)
    if (error) setError(error.message)
    else load()
  }

  async function handleDelete(item) {
    setError(null)
    const { error } = await supabase.from(table).delete().eq('id', item.id)
    if (error) setError(error.message)
    else load()
  }

  const canDelete = (item) => item.created_by === user.id || event.creator_id === user.id

  return (
    <section style={{ marginTop: '1.5rem' }}>
      <h2 style={{ fontSize: '1.1rem', borderBottom: '1px solid #ddd', paddingBottom: '0.25rem' }}>{title}</h2>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}

      {loading ? (
        <p>טוען...</p>
      ) : items.length === 0 ? (
        <p style={{ color: '#888' }}>אין עדיין פריטים.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {items.map((item) => (
            <li
              key={item.id}
              style={{
                border: '1px solid #eee',
                borderRadius: 6,
                padding: '0.5rem 0.75rem',
                marginBottom: '0.4rem',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {statusField && (
                <input
                  type="checkbox"
                  checked={!!item[statusField]}
                  onChange={() => handleToggleStatus(item)}
                  title={statusLabel}
                />
              )}
              <strong style={{ textDecoration: statusField && item[statusField] ? 'line-through' : 'none' }}>
                {item.name}
              </strong>
              {hasQuantity && item.quantity && <span style={{ color: '#666' }}>({item.quantity})</span>}
              {extraField && item[extraField.name] && (
                <span style={{ color: '#666' }}>
                  {extraField.label}: {item[extraField.name]}
                </span>
              )}

              <select
                value={item.assigned_to || ''}
                onChange={(e) => handleReassign(item, e.target.value)}
                style={{ marginInlineStart: 'auto' }}
              >
                <option value="">לא שויך</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>

              {canDelete(item) && (
                <button onClick={() => handleDelete(item)} title="מחק">
                  מחיקה
                </button>
              )}
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleAdd} style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', marginTop: '0.5rem' }}>
        <input
          type="text"
          placeholder="שם פריט"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ flex: '1 1 140px' }}
        />
        {hasQuantity && (
          <input
            type="text"
            placeholder="כמות (חופשי)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            style={{ flex: '1 1 100px' }}
          />
        )}
        {extraField && (
          <input
            type="text"
            placeholder={extraField.placeholder}
            value={extraValue}
            onChange={(e) => setExtraValue(e.target.value)}
            style={{ flex: '1 1 100px' }}
          />
        )}
        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} style={{ flex: '1 1 120px' }}>
          <option value="">לא שויך</option>
          {members.map((m) => (
            <option key={m.user_id} value={m.user_id}>
              {m.full_name || m.email}
            </option>
          ))}
        </select>
        <button type="submit" disabled={adding}>
          הוסף +
        </button>
      </form>
    </section>
  )
}
