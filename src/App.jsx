import { useState } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Events from './pages/Events'
import EventDetail from './pages/EventDetail'

function AppInner() {
  const { session, loading } = useAuth()
  const [selectedEvent, setSelectedEvent] = useState(null)

  if (loading) {
    return <p style={{ textAlign: 'center', marginTop: '4rem' }}>טוען...</p>
  }

  if (!session) return <Login />

  if (selectedEvent) {
    return <EventDetail event={selectedEvent} onBack={() => setSelectedEvent(null)} />
  }

  return <Events onOpenEvent={setSelectedEvent} />
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  )
}
