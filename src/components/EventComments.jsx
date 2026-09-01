import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'

export default function EventComments({ event, members }) {
  const { user } = useAuth()
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [text, setText] = useState('')
  const [posting, setPosting] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('event_comments')
      .select('*')
      .eq('event_id', event.id)
      .order('created_at', { ascending: true })
    if (error) setError(error.message)
    else setComments(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [event.id])

  function authorName(userId) {
    if (userId === user.id) return 'את/ה'
    const m = members.find((m) => m.user_id === userId)
    return m?.full_name || m?.email || 'משתמש'
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setPosting(true)
    setError(null)
    const { error } = await supabase
      .from('event_comments')
      .insert({ event_id: event.id, user_id: user.id, text: text.trim() })
    setPosting(false)
    if (error) {
      setError(error.message)
    } else {
      setText('')
      await load()
    }
  }

  return (
    <section className="card" style={{ marginBottom: 'var(--space-4)' }}>
      <h2>💬 תגובות</h2>
      {event.status !== 'open' && (
        <p className="text-muted text-small">
          האירוע אינו פעיל — אי אפשר לערוך את פרטיו או את הרשימות, אבל אפשר להוסיף כאן תגובה (מה היה חסר, מה היה מיותר וכו').
        </p>
      )}

      {error && <p className="text-danger text-small">{error}</p>}

      {loading ? (
        <p className="text-muted text-small">טוען...</p>
      ) : comments.length === 0 ? (
        <p className="text-muted text-small">אין עדיין תגובות.</p>
      ) : (
        <ul className="plain">
          {comments.map((c) => (
            <li key={c.id} className="list-item" style={{ display: 'block' }}>
              <div className="row-between">
                <strong className="text-small">{authorName(c.user_id)}</strong>
                <span className="text-muted text-small">{new Date(c.created_at).toLocaleString('he-IL')}</span>
              </div>
              <p style={{ margin: '4px 0 0 0', whiteSpace: 'pre-wrap' }}>{c.text}</p>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={handleSubmit} className="row" style={{ marginTop: 'var(--space-2)' }}>
        <input
          type="text"
          placeholder="הוסף/י תגובה..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          style={{ flex: 1 }}
        />
        <button type="submit" disabled={posting} className="btn-primary">
          שליחה
        </button>
      </form>
    </section>
  )
}
