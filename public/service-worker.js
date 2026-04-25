// Service Worker for handling push notifications
// Place in: public/service-worker.js

self.addEventListener('push', (event) => {
  if (!event.data) return

  try {
    const data = event.data.json()
    
    const options = {
      body: data.body,
      icon: '/logo.png',
      badge: '/badge.png',
      tag: `session-${data.sessionId}`, // Prevent duplicates
      requireInteraction: false, // Auto-dismiss after a while
      data: {
        sessionId: data.sessionId,
        url: data.url || '/dashboard'
      }
    }

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    )
  } catch (error) {
    console.error('Push notification error:', error)
  }
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const data = event.notification.data
  const url = data.url || '/dashboard'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if the window is already open
      for (const client of clientList) {
        if (client.url === url && 'focus' in client) {
          return client.focus()
        }
      }
      // Otherwise, open new window
      if (clients.openWindow) {
        return clients.openWindow(url)
      }
    })
  )
})

// Handle notification close (optional - for analytics)
self.addEventListener('notificationclose', (event) => {
  // Could send analytics here if needed
  console.log('Notification closed:', event.notification.tag)
})
