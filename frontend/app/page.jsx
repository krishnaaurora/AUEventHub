"use client"

import { useEffect, useMemo, useState } from "react"

const defaultBackendUrl = "https://backend-gold-one-92.vercel.app"

export default function HomePage() {
  const backendUrl = useMemo(() => {
    const value = process.env.NEXT_PUBLIC_BACKEND_URL || defaultBackendUrl
    return value.replace(/\/$/, "")
  }, [])

  const [status, setStatus] = useState("loading")
  const [message, setMessage] = useState("Checking backend health...")
  const [events, setEvents] = useState([])
  const [eventsState, setEventsState] = useState("loading")
  const [authMessage, setAuthMessage] = useState("Not tested")

  useEffect(() => {
    let isMounted = true

    async function checkBackend() {
      try {
        const res = await fetch(`${backendUrl}/api/health`, { cache: "no-store" })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        if (!isMounted) {
          return
        }
        setStatus("ok")
        setMessage(`Backend is healthy. Timestamp: ${data.timestamp}`)
      } catch (error) {
        if (!isMounted) {
          return
        }
        setStatus("error")
        setMessage(`Backend check failed: ${error.message}`)
      }
    }

    async function loadEvents() {
      try {
        const res = await fetch(`${backendUrl}/api/events`, { cache: "no-store" })
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`)
        }
        const data = await res.json()
        if (!isMounted) {
          return
        }
        setEvents(Array.isArray(data.items) ? data.items : [])
        setEventsState("ok")
      } catch (error) {
        if (!isMounted) {
          return
        }
        setEventsState(`error: ${error.message}`)
      }
    }

    checkBackend()
    loadEvents()
    return () => {
      isMounted = false
    }
  }, [backendUrl])

  async function runLoginDemo() {
    setAuthMessage("Running login test...")
    try {
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: "admin@aieventmang.com", password: "admin123" })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`)
      }
      setAuthMessage(`Login success for ${data.user.email}`)
    } catch (error) {
      setAuthMessage(`Login failed: ${error.message}`)
    }
  }

  const statusColor = status === "ok" ? "#166534" : status === "error" ? "#991b1b" : "#92400e"
  const badgeBg = status === "ok" ? "#dcfce7" : status === "error" ? "#fee2e2" : "#fef3c7"

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif", lineHeight: 1.5 }}>
      <h1>AI-EVENTMANG</h1>
      <p>Frontend is deployed and connected to backend.</p>

      <section style={{ marginTop: "1.5rem", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>System Status</h2>
        <p>
          Backend URL: <a href={backendUrl} target="_blank" rel="noreferrer">{backendUrl}</a>
        </p>
        <p>
          <span style={{ color: statusColor, background: badgeBg, padding: "0.25rem 0.5rem", borderRadius: "6px" }}>
            {status.toUpperCase()}
          </span>
        </p>
        <p>{message}</p>
      </section>

      <section style={{ marginTop: "1rem", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Events API</h2>
        <p>Load status: {eventsState}</p>
        <ul>
          {events.map((event) => (
            <li key={event.id}>
              {event.title} - {event.date} - {event.venue}
            </li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: "1rem", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "1rem" }}>
        <h2 style={{ marginTop: 0 }}>Auth API Demo</h2>
        <button
          onClick={runLoginDemo}
          style={{
            border: "1px solid #111827",
            borderRadius: "8px",
            background: "#111827",
            color: "#ffffff",
            padding: "0.5rem 0.9rem",
            cursor: "pointer"
          }}
        >
          Test Login
        </button>
        <p>{authMessage}</p>
      </section>
    </main>
  )
}
