import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import ItemListSection from '../components/ItemListSection'
import QuickAddBar from '../components/QuickAddBar'
import ImportExcelWizard from '../components/ImportExcelWizard'
import EditEventModal from '../components/EditEventModal'
import EventComments from '../components/EventComments'

export default function EventDetail({ event: initialEvent, onBack }) {
  const { user } = useAuth()
  const [event, setEvent] = useState(initialEvent)
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showImport, setShowImport] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [refreshCounters, setRefreshCounters] = useState({
    equipment_items: 0,
    shopping_items: 0,
    menu_items: 0,
  })
  const isCreator = event.creator_id === user.id
  const isEventOpen = event.status === 'open'

  async function loadMembers() {
    setLoading(true)
    setError(null)
    const { data: memberRows, error: memberErr } = await supabase
      .from('event_members')
      .select('user_id, role')
      .eq('event_id', event.id)

    if (memberErr) {
      setError(memberErr.message)
      setLoading(false)
      return
    }

    const userIds = memberRows.map((m) => m.user_id)
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id, full_name, email')
      .in('id', userIds)

    if (profileErr) {
      setError(profileErr.message)
      setLoading(false)
      return
    }

    const merged = memberRows.map((m) => {
      const p = profiles.find((p) => p.id === m.user_id)
      return { user_id: m.user_id, role: m.role, full_name: p?.full_name, email: p?.email }
    })
    setMembers(merged)
    setLoading(false)
  }

  useEffect(() => {
    loadMembers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id])

  async function handleRemoveMember(member) {
    if (!window.confirm(`להסיר את ${member.full_name || member.email} מהאירוע?`)) return
    setError(null)
    const { error } = await supabase
      .from('event_members')
      .delete()
      .eq('event_id', event.id)
      .eq('user_id', member.user_id)
    if (error) setError(error.message)
    else loadMembers()
  }

  return (
    <div className="page">
      <div className="container">
        <div className="row-between" style={{ marginBottom: 'var(--space-3)' }}>
          <button onClick={onBack} className="btn-ghost btn-sm">
            ← חזרה לאירועים
          </button>
          {isCreator && (
            <button onClick={() => setShowEdit(true)} className="btn-sm">
              עריכת פרטי אירוע
            </button>
          )}
        </div>

        <div className="card" style={{ marginBottom: 'var(--space-4)' }}>
          <div className="row-between">
            <h1>{event.name}</h1>
            <div className="row" style={{ width: 'auto' }}>
              {event.status === 'finished' && <span className="badge">הסתיים</span>}
              {event.status === 'cancelled' && (
                <span className="badge" style={{ color: 'var(--color-danger)' }}>
                  בוטל
                </span>
              )}
              {event.event_type && <span className="badge badge-primary">{event.event_type}</span>}
            </div>
          </div>
          <p className="text-muted text-small">
            מספר אירוע: <strong>{event.event_number}</strong>
            {event.starts_at ? ` · ${event.starts_at}${event.ends_at ? ` – ${event.ends_at}` : ''}` : ''}
            {event.adults_count != null || event.children_count != null
              ? ` · ${event.adults_count || 0} מבוגרים, ${event.children_count || 0} ילדים`
              : ''}
          </p>

          {error && <p className="text-danger text-small">{error}</p>}
          {loading ? (
            <p className="text-muted text-small">טוען חברי אירוע...</p>
          ) : (
            <div className="row" style={{ marginTop: 'var(--space-2)' }}>
              {members.map((m) => (
                <span key={m.user_id} className="badge" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {m.full_name || m.email}
                  {m.role === 'creator' && ' 👑'}
                  {isCreator && m.user_id !== user.id && (
                    <button
                      onClick={() => handleRemoveMember(m)}
                      className="btn-ghost"
                      style={{ padding: '0 2px', fontSize: '0.9rem', lineHeight: 1 }}
                      title="הסרה"
                    >
                      ✕
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>

        {!loading && (
          <>
            {isEventOpen && (
              <>
                <QuickAddBar
                  event={event}
                  members={members}
                  onAdded={(table) => setRefreshCounters((c) => ({ ...c, [table]: c[table] + 1 }))}
                />
                <button onClick={() => setShowImport(true)} style={{ marginBottom: 'var(--space-4)' }}>
                  📄 ייבוא מ-Excel
                </button>
              </>
            )}

            <ItemListSection
              key={`equipment_items-${refreshCounters.equipment_items}`}
              table="equipment_items"
              event={event}
              members={members}
              title="🎒 ציוד"
              statusField="is_brought"
              statusLabel="הובא"
              readOnly={!isEventOpen}
            />

            <ItemListSection
              key={`shopping_items-${refreshCounters.shopping_items}`}
              table="shopping_items"
              event={event}
              members={members}
              title="🛒 קניות"
              statusField="is_bought"
              statusLabel="נקנה"
              readOnly={!isEventOpen}
            />

            <ItemListSection
              key={`menu_items-${refreshCounters.menu_items}`}
              table="menu_items"
              event={event}
              members={members}
              title="🍽️ תפריט"
              extraField={{ name: 'meal_type', label: 'ארוחה', placeholder: 'סוג ארוחה (חופשי)' }}
              readOnly={!isEventOpen}
            />

            <EventComments event={event} members={members} />

            {showImport && (
              <ImportExcelWizard
                event={event}
                onClose={() => setShowImport(false)}
                onImported={(table) => {
                  setRefreshCounters((c) => ({ ...c, [table]: c[table] + 1 }))
                  setShowImport(false)
                }}
              />
            )}

            {showEdit && (
              <EditEventModal
                event={event}
                onClose={() => setShowEdit(false)}
                onSaved={(updated) => {
                  setEvent(updated)
                  setShowEdit(false)
                }}
                onDeleted={onBack}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}
