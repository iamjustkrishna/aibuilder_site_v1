"use client"

import { createClient } from "@/lib/supabase/client"
import { usePathname } from "next/navigation"
import { useEffect, useMemo, useRef } from "react"

const SESSION_KEY = "aibuilder.activity.session-key"
const HEARTBEAT_INTERVAL = 30000

export function ActivityTracker() {
  const pathname = usePathname()
  const supabase = useMemo(() => createClient(), [])
  const sessionKeyRef = useRef<string>("")
  const userIdRef = useRef<string | null>(null)
  const activeSinceRef = useRef<number | null>(null)
  const pathnameRef = useRef(pathname)
  const mountedRef = useRef(false)

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    sessionKeyRef.current = window.localStorage.getItem(SESSION_KEY) || crypto.randomUUID()
    window.localStorage.setItem(SESSION_KEY, sessionKeyRef.current)
    mountedRef.current = true

    const sendHeartbeat = async (activeSeconds: number, ended = false, path = pathnameRef.current) => {
      if (!userIdRef.current || !sessionKeyRef.current) {
        return
      }

      await fetch("/api/activity/heartbeat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionKey: sessionKeyRef.current,
          pagePath: path,
          activeSeconds,
          ended,
          userAgent: navigator.userAgent,
        }),
        keepalive: true,
      })
    }

    const startTracking = async () => {
      const { data } = await supabase.auth.getUser()
      if (!mountedRef.current || !data.user?.id) {
        return
      }

      userIdRef.current = data.user.id
      activeSinceRef.current = Date.now()
      await sendHeartbeat(0, false)
    }

    const flushActiveTime = async (ended = false) => {
      if (!userIdRef.current || !activeSinceRef.current) {
        if (ended && userIdRef.current) {
          await sendHeartbeat(0, true)
        }
        return
      }

      const elapsedSeconds = Math.max(0, Math.round((Date.now() - activeSinceRef.current) / 1000))
      activeSinceRef.current = Date.now()
      await sendHeartbeat(elapsedSeconds, ended)
      if (ended) {
        activeSinceRef.current = null
      }
    }

    const handleVisibility = async () => {
      const isVisible = document.visibilityState === "visible" && document.hasFocus()
      if (isVisible) {
        if (!activeSinceRef.current) {
          activeSinceRef.current = Date.now()
        }
      } else {
        await flushActiveTime(false)
        activeSinceRef.current = null
      }
    }

    const handleFocus = () => {
      if (!activeSinceRef.current) {
        activeSinceRef.current = Date.now()
      }
    }

    const handleBlur = async () => {
      await flushActiveTime(false)
      activeSinceRef.current = null
    }

    const heartbeatTimer = window.setInterval(async () => {
      if (document.visibilityState !== "visible" || !document.hasFocus()) {
        return
      }
      await flushActiveTime(false)
    }, HEARTBEAT_INTERVAL)

    const beforeUnload = () => {
      void flushActiveTime(true)
    }

    void startTracking()
    document.addEventListener("visibilitychange", handleVisibility)
    window.addEventListener("focus", handleFocus)
    window.addEventListener("blur", handleBlur)
    window.addEventListener("beforeunload", beforeUnload)

    return () => {
      mountedRef.current = false
      clearInterval(heartbeatTimer)
      document.removeEventListener("visibilitychange", handleVisibility)
      window.removeEventListener("focus", handleFocus)
      window.removeEventListener("blur", handleBlur)
      window.removeEventListener("beforeunload", beforeUnload)
      void flushActiveTime(true)
    }
  }, [supabase])

  return null
}
