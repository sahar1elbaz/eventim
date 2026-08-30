import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.7-3.88 2.7-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.98v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.16.28-1.7V4.97H.98A9 9 0 0 0 0 9c0 1.45.35 2.83.98 4.03l2.97-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.51.46 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .98 4.97l2.97 2.33C4.66 5.17 6.65 3.58 9 3.58z"
      />
    </svg>
  )
}

export default function Login() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [info, setInfo] = useState(null)
  const [busy, setBusy] = useState(false)

  async function handleGoogle() {
    setError(null)
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    })
    if (error) setError(error.message)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setBusy(true)

    if (mode === 'signup') {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName } },
      })
      if (error) {
        setError(error.message)
      } else {
        setInfo('נרשמת בהצלחה! אם נדרש אימות אימייל, בדוק/י את תיבת הדואר.')
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) setError(error.message)
    }
    setBusy(false)
  }

  return (
    <div className="page" style={{ display: 'flex', alignItems: 'center', minHeight: '100vh' }}>
      <div className="container-narrow" style={{ width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 'var(--space-5)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 'var(--space-1)' }}>🏕️</div>
          <h1>תיאום אירועים</h1>
          <p className="text-muted text-small">התחברו כדי לראות את האירועים שלכם</p>
        </div>

        <div className="card stack">
          <button onClick={handleGoogle} className="row" style={{ width: '100%', justifyContent: 'center' }}>
            <GoogleIcon />
            התחברות עם Google
          </button>

          <div className="row" style={{ margin: 'var(--space-1) 0' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
            <span className="text-muted text-small">או</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid var(--color-border)' }} />
          </div>

          <div className="row" style={{ background: 'var(--color-surface-alt)', borderRadius: 'var(--radius-sm)', padding: 3 }}>
            <button
              onClick={() => setMode('signin')}
              className={mode === 'signin' ? 'btn-primary' : 'btn-ghost'}
              style={{ flex: 1, border: 'none' }}
            >
              התחברות
            </button>
            <button
              onClick={() => setMode('signup')}
              className={mode === 'signup' ? 'btn-primary' : 'btn-ghost'}
              style={{ flex: 1, border: 'none' }}
            >
              הרשמה כאורח
            </button>
          </div>

          <form onSubmit={handleSubmit} className="stack">
            {mode === 'signup' && (
              <input
                type="text"
                placeholder="שם מלא"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            )}
            <input
              type="email"
              placeholder="אימייל"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="סיסמה"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
            <button type="submit" disabled={busy} className="btn-primary">
              {busy ? '...' : mode === 'signup' ? 'הרשמה' : 'התחברות'}
            </button>
          </form>

          {error && <p className="text-danger text-small">{error}</p>}
          {info && <p className="text-small" style={{ color: 'var(--color-success)' }}>{info}</p>}
        </div>
      </div>
    </div>
  )
}
