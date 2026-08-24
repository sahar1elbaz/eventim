import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import ItemListSection from '../components/ItemListSection'

export default function EventDetail({ event, onBack }) {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
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

    loadMembers()
  }, [event.id])

  return (
    <div style={{ maxWidth: 560, margin: '2rem auto', direction: 'rtl', fontFamily: 'sans-serif' }}>
      <button onClick={onBack} style={{ marginBottom: '0.5rem', cursor: 'pointer' }}>
        ← חזרה לאירועים
      </button>
      <h1 style={{ marginBottom: 0 }}>{event.name}</h1>
      <p style={{ color: '#666', marginTop: '0.25rem' }}>
        מספר אירוע: {event.event_number}
        {event.event_type ? ` · סוג: ${event.event_type}` : ''}
      </p>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {loading ? (
        <p>טוען חברי אירוע...</p>
      ) : (
        <>
          <p style={{ color: '#666', fontSize: '0.9rem' }}>
            חברים: {members.map((m) => m.full_name || m.email).join(', ')}
          </p>

          <ItemListSection
            table="equipment_items"
            event={event}
            members={members}
            title="ציוד"
            statusField="is_brought"
            statusLabel="הובא"
          />

          <ItemListSection
            table="shopping_items"
            event={event}
            members={members}
            title="קניות"
            statusField="is_bought"
            statusLabel="נקנה"
          />

          <ItemListSection
            table="menu_items"
            event={event}
            members={members}
            title="תפריט"
            extraField={{ name: 'meal_type', label: 'ארוחה', placeholder: 'סוג ארוחה (חופשי)' }}
            hasQuantity={false}
          />
        </>
      )}
    </div>
  )
}
