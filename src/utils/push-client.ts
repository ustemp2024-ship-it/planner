// Push notification client for anonymous device support
import { iosInstaller } from './ios-installer'

export class PushClient {
  private deviceId: string
  private pushServerUrl: string
  private vapidPublicKey: string | null = null

  constructor(pushServerUrl: string = 'http://localhost:3001') {
    this.pushServerUrl = pushServerUrl
    this.deviceId = this.getOrCreateDeviceId()
  }

  // Get or create unique device ID
  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('planner-device-id')
    
    if (!deviceId) {
      // Generate unique device ID
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('planner-device-id', deviceId)
    }
    
    return deviceId
  }

  // Get device ID
  public getDeviceId(): string {
    return this.deviceId
  }

  // Get VAPID public key from server
  private async getVapidPublicKey(): Promise<string> {
    if (this.vapidPublicKey) return this.vapidPublicKey
    
    try {
      const response = await fetch(`${this.pushServerUrl}/api/push/vapid-key`)
      const data = await response.json()
      this.vapidPublicKey = data.publicKey
      return data.publicKey
    } catch (error) {
      console.error('Failed to get VAPID public key:', error)
      // Fallback to hardcoded key (not recommended for production)
      return 'BNOJyTgwrEwK9lbetRcougxkRgLpPs1DX0YCfA5ZzXu4z9p_Et5EnW8vxxPMBIysOTlJ0cxecMAt54cI4yhwIKg'
    }
  }

  // Convert base64 to Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/')
    
    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)
    
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    
    return outputArray
  }

  // Check if push notifications are supported
  public isSupported(): boolean {
    if (!('serviceWorker' in navigator)) return false
    if (!('PushManager' in window)) return false
    if (!('Notification' in window)) return false
    
    // iOS-specific checks
    if (iosInstaller.isIOSDevice()) {
      return iosInstaller.isNotificationSupported()
    }
    
    return true
  }

  // Request notification permission
  public async requestPermission(): Promise<NotificationPermission> {
    if (!this.isSupported()) {
      console.warn('Push notifications not supported on this device')
      return 'denied'
    }
    
    // iOS requires app to be installed
    if (iosInstaller.isIOSDevice() && !iosInstaller.isAppInstalled()) {
      console.warn('iOS requires app to be installed for push notifications')
      return 'denied'
    }
    
    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    
    return permission
  }

  // Subscribe to push notifications
  public async subscribe(settings: any = {}): Promise<boolean> {
    try {
      // Check permission
      const permission = await this.requestPermission()
      if (permission !== 'granted') {
        console.warn('Notification permission not granted')
        return false
      }
      
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      
      // Get VAPID public key
      const vapidKey = await this.getVapidPublicKey()
      const convertedVapidKey = this.urlBase64ToUint8Array(vapidKey)
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription()
      
      if (!subscription) {
        // Create new subscription
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey as BufferSource
        })
        console.log('Push subscription created:', subscription)
      }
      
      // Send subscription to server
      const response = await fetch(`${this.pushServerUrl}/api/push/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          subscription: subscription.toJSON(),
          settings: {
            enabled: true,
            dailyBriefing: true,
            dailyBriefingTime: '08:00',
            deadlineReminder: true,
            deadlineReminderHours: 24,
            dailySummary: true,
            dailySummaryTime: '21:00',
            ...settings
          }
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to subscribe on server')
      }
      
      const result = await response.json()
      console.log('Subscription saved:', result)
      
      // Store subscription status
      localStorage.setItem('planner-push-subscribed', 'true')
      
      return true
    } catch (error) {
      console.error('Subscribe error:', error)
      return false
    }
  }

  // Unsubscribe from push notifications
  public async unsubscribe(): Promise<boolean> {
    try {
      // Get service worker registration
      const registration = await navigator.serviceWorker.ready
      
      // Get existing subscription
      const subscription = await registration.pushManager.getSubscription()
      
      if (subscription) {
        // Unsubscribe from browser
        await subscription.unsubscribe()
      }
      
      // Notify server
      await fetch(`${this.pushServerUrl}/api/push/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId
        })
      })
      
      // Clear subscription status
      localStorage.removeItem('planner-push-subscribed')
      
      return true
    } catch (error) {
      console.error('Unsubscribe error:', error)
      return false
    }
  }

  // Check if subscribed
  public async isSubscribed(): Promise<boolean> {
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      return subscription !== null
    } catch (error) {
      return false
    }
  }

  // Update notification settings
  public async updateSettings(settings: any): Promise<boolean> {
    try {
      const response = await fetch(`${this.pushServerUrl}/api/push/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          settings
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('Update settings error:', error)
      return false
    }
  }

  // Sync tasks to server (for scheduled notifications)
  public async syncTasks(tasks: any[]): Promise<boolean> {
    try {
      const response = await fetch(`${this.pushServerUrl}/api/push/sync-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          tasks
        })
      })
      
      return response.ok
    } catch (error) {
      console.error('Sync tasks error:', error)
      return false
    }
  }

  // Send test notification
  public async sendTestNotification(): Promise<boolean> {
    try {
      const response = await fetch(`${this.pushServerUrl}/api/push/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId
        })
      })
      
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Test notification error:', error)
      return false
    }
  }

  // Send custom notification
  public async sendNotification(notification: {
    title: string
    body: string
    icon?: string
    badge?: string
    tag?: string
    data?: any
    requireInteraction?: boolean
  }): Promise<boolean> {
    try {
      const response = await fetch(`${this.pushServerUrl}/api/push/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId: this.deviceId,
          notification
        })
      })
      
      const result = await response.json()
      return result.success
    } catch (error) {
      console.error('Send notification error:', error)
      return false
    }
  }
}

// Singleton instance with configurable server URL
const pushServerUrl = import.meta.env.VITE_PUSH_SERVER_URL || 'http://localhost:3001'
export const pushClient = new PushClient(pushServerUrl)