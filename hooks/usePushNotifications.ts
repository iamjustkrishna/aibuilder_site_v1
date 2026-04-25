'use client'

import { useEffect, useState } from 'react'

interface PushNotificationState {
  supported: boolean
  subscribed: boolean
  loading: boolean
  error: string | null
}

export function usePushNotifications() {
  const [state, setState] = useState<PushNotificationState>({
    supported: false,
    subscribed: false,
    loading: true,
    error: null,
  })

  useEffect(() => {
    checkPushSupport()
  }, [])

  async function checkPushSupport() {
    try {
      const supported =
        'serviceWorker' in navigator &&
        'PushManager' in window &&
        'Notification' in window

      if (!supported) {
        setState((prev) => ({
          ...prev,
          supported: false,
          loading: false,
        }))
        return
      }

      setState((prev) => ({ ...prev, supported: true }))

      // Register service worker
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker.register('/service-worker.js')
        } catch (error) {
          console.error('Service Worker registration failed:', error)
        }
      }

      // Check if already subscribed
      const subscription = await getSubscription()
      setState((prev) => ({
        ...prev,
        subscribed: !!subscription,
        loading: false,
      }))
    } catch (error) {
      console.error('Push support check failed:', error)
      setState((prev) => ({
        ...prev,
        loading: false,
        error: 'Failed to check push support',
      }))
    }
  }

  async function getSubscription() {
    if (!('serviceWorker' in navigator)) return null
    const registration = await navigator.serviceWorker.ready
    return await registration.pushManager.getSubscription()
  }

  async function requestPermission() {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      // Request notification permission
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: 'Notification permission denied',
        }))
        return false
      }

      // Subscribe to push notifications
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
      })

      // Save subscription to backend
      const response = await fetch('/api/push-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      })

      if (!response.ok) {
        throw new Error('Failed to save subscription')
      }

      setState((prev) => ({
        ...prev,
        subscribed: true,
        loading: false,
      }))
      return true
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to subscribe'
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      return false
    }
  }

  async function unsubscribe() {
    try {
      setState((prev) => ({ ...prev, loading: true, error: null }))

      const subscription = await getSubscription()
      if (!subscription) {
        setState((prev) => ({
          ...prev,
          subscribed: false,
          loading: false,
        }))
        return true
      }

      // Notify backend
      await fetch('/api/push-subscribe', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          endpoint: subscription.endpoint,
        }),
      })

      // Unsubscribe from service worker
      await subscription.unsubscribe()

      setState((prev) => ({
        ...prev,
        subscribed: false,
        loading: false,
      }))
      return true
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to unsubscribe'
      setState((prev) => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }))
      return false
    }
  }

  return {
    ...state,
    requestPermission,
    unsubscribe,
  }
}
