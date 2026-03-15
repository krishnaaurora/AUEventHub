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

    checkBackend()
    return () => {
      isMounted = false
    }
  }, [backendUrl])

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
    </main>
  )
}
