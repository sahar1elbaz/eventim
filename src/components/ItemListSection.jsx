import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

/**
 * Generic list section for equipment / shopping / menu items.
 * All three tables share the same shape (event_id, name, quantity, assigned_to,
 * created_by, created_at) plus an optional boolean status field and an optional
 * extra text field (e.g. meal_type for the menu).
 *
 * Adding items happens elsewhere now (QuickAddBar, the create wizard, or Excel
 * import) — this component only displays and manages existing items.
 */
export default function ItemListSection({
  table,
  event,
  members,
  title,
  statusField, // 'is_brought' | 'is_bought' | null
  statusLabel, // e.g. 'הובא'
  extraField, // { name, label } | null
  hasQuantity = true,
  readOnly = false,
}) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, event.id])

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

  async function handleUpdateField(item, field, rawValue) {
    const value = rawValue.trim() || null
    if (value === (item[field] || null)) return
    setError(null)
    const { error } = await supabase
      .from(table)
      .update({ [field]: value })
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
    <section className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <h2>{title}</h2>

      {error && <p className="text-danger text-small">{error}</p>}

      {loading ? (
        <p className="text-muted text-small">טוען...</p>
      ) : items.length === 0 ? (
        <p className="text-muted text-small">אין עדיין פריטים.</p>
      ) : (
        <ul className="plain">
          {items.map((item) => (
            <li key={item.id} className="list-item">
              {statusField && (
                <input
                  type="checkbox"
                  checked={!!item[statusField]}
                  onChange={() => handleToggleStatus(item)}
                  disabled={readOnly}
                  title={statusLabel}
                />
              )}
              <span style={{ textDecoration: statusField && item[statusField] ? 'line-through' : 'none' }}>
                <strong>{item.name}</strong>
              </span>

              {hasQuantity &&
                (readOnly ? (
                  item.quantity && <span className="text-muted text-small">({item.quantity})</span>
                ) : (
                  <input
                    key={`${item.id}-quantity-${item.quantity || ''}`}
                    type="text"
                    defaultValue={item.quantity || ''}
                    placeholder="כמות"
                    onBlur={(e) => handleUpdateField(item, 'quantity', e.target.value)}
                    className="text-small"
                    style={{ width: 90 }}
                  />
                ))}

              {extraField &&
                (readOnly ? (
                  item[extraField.name] && (
                    <span className="text-muted text-small">
                      {extraField.label}: {item[extraField.name]}
                    </span>
                  )
                ) : (
                  <input
                    key={`${item.id}-${extraField.name}-${item[extraField.name] || ''}`}
                    type="text"
                    defaultValue={item[extraField.name] || ''}
                    placeholder={extraField.label}
                    onBlur={(e) => handleUpdateField(item, extraField.name, e.target.value)}
                    className="text-small"
                    style={{ width: 110 }}
                  />
                ))}

              <select
                value={item.assigned_to || ''}
                onChange={(e) => handleReassign(item, e.target.value)}
                disabled={readOnly}
                className="spacer"
                style={{ width: 'auto', maxWidth: 160 }}
              >
                <option value="">לא שויך</option>
                {members.map((m) => (
                  <option key={m.user_id} value={m.user_id}>
                    {m.full_name || m.email}
                  </option>
                ))}
              </select>

              {!readOnly && canDelete(item) && (
                <button onClick={() => handleDelete(item)} className="btn-danger btn-sm" title="מחק">
                  מחיקה
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
