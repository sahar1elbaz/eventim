import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

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
    <div style={{ maxWidth: 360, margin: '4rem auto', direction: 'rtl', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center' }}>תיאום אירועים</h1>

      <button
        onClick={handleGoogle}
        style={{ width: '100%', padding: '0.6rem', marginBottom: '1rem', cursor: 'pointer' }}
      >
        התחברות עם Google
      </button>

      <div style={{ textAlign: 'center', margin: '0.5rem 0', color: '#888' }}>או</div>

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
        <button
          onClick={() => setMode('signin')}
          style={{ flex: 1, fontWeight: mode === 'signin' ? 'bold' : 'normal' }}
        >
          התחברות
        </button>
        <button
          onClick={() => setMode('signup')}
          style={{ flex: 1, fontWeight: mode === 'signup' ? 'bold' : 'normal' }}
        >
          הרשמה כאורח
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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
        <button type="submit" disabled={busy} style={{ padding: '0.6rem', cursor: 'pointer' }}>
          {mode === 'signup' ? 'הרשמה' : 'התחברות'}
        </button>
      </form>

      {error && <p style={{ color: 'crimson' }}>{error}</p>}
      {info && <p style={{ color: 'green' }}>{info}</p>}
    </div>
  )
}
