import { useEffect, useRef, useState } from 'react'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Dashboard from './components/Dashboard'
import CompareSection from './components/CompareSection'
import AboutSection from './components/AboutSection'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import { normalizeRepostData } from './lib/reposts'

function App() {
  const [username, setUsername] = useState('')
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const dashboardRef = useRef(null)

  useEffect(() => {
    if (loading || (!data && !error)) return
    const timeout = window.setTimeout(() => {
      if (!dashboardRef.current) return
      const rect = dashboardRef.current.getBoundingClientRect()
      const top = rect.top + window.scrollY - 80
      window.scrollTo({ top, behavior: 'smooth' })
    }, 150)
    return () => window.clearTimeout(timeout)
  }, [data, error, loading])

  const handleFetch = async (user) => {
    setLoading(true)
    setError(null)
    setData(null)

    try {
      const clean = user.replace(/^@/, '')
      console.log('Fetching reposts for:', clean)
      const res = await fetch(`/api/reposts/${encodeURIComponent(clean)}`)
      const text = await res.text()
      const json = text ? JSON.parse(text) : {}

      if (!res.ok) {
        throw new Error(json.error || `HTTP ${res.status}`)
      }

      if (json.success === false) {
        throw new Error(json.error || 'No repost data found for this user')
      }

      setData(normalizeRepostData(json, clean))
    } catch (err) {
      console.error('Fetch error:', err)
      setError(err instanceof SyntaxError ? 'Server returned an invalid response.' : err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ErrorBoundary>
      <div className="relative min-h-screen bg-void text-white overflow-x-hidden noise-overlay">
        <div className="fixed inset-0 bg-radial-mesh pointer-events-none z-0" />
        <div className="relative z-10">
          <Nav />
          <Hero
            onFetch={handleFetch}
            username={username}
            setUsername={setUsername}
            loading={loading}
            error={error}
          />
          <div id="dashboard" ref={dashboardRef}>
            <Dashboard data={data} loading={loading} error={error} />
          </div>
          <CompareSection />
          <AboutSection />
          <Footer />
        </div>
      </div>
    </ErrorBoundary>
  )
}

export default App
