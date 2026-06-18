// Push Notification Manager
import type { Task } from '../types'

export class NotificationManager {
  private registration: ServiceWorkerRegistration | null = null
  private permission: NotificationPermission = 'default'
  private pushSubscription: PushSubscription | null = null

  // Service Worker 등록 및 Push 구독
  async register(): Promise<void> {
    if ('serviceWorker' in navigator && 'PushManager' in window) {
      try {
        // Service Worker 등록
        this.registration = await navigator.serviceWorker.register('/service-worker.js')
        console.log('Service Worker registered:', this.registration)
        
        // Service Worker 활성화 대기
        await navigator.serviceWorker.ready
        
        // Push 구독 확인 및 생성
        await this.subscribeToPush()
        
        // IndexedDB 초기화
        await this.initIndexedDB()
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }
  
  // Push 알림 구독
  private async subscribeToPush(): Promise<void> {
    if (!this.registration) return
    
    try {
      // 기존 구독 확인
      this.pushSubscription = await this.registration.pushManager.getSubscription()
      
      if (!this.pushSubscription) {
        // VAPID public key (실제 환경에서는 환경변수로 관리)
        const vapidPublicKey = 'BNOJyTgwrEwK9lbetRcougxkRgLpPs1DX0YCfA5ZzXu4z9p_Et5EnW8vxxPMBIysOTlJ0cxecMAt54cI4yhwIKg'
        
        const convertedVapidKey = this.urlBase64ToUint8Array(vapidPublicKey)
        
        // 새 구독 생성
        this.pushSubscription = await this.registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: convertedVapidKey
        })
        
        console.log('Push subscription created:', this.pushSubscription)
        
        // 서버에 구독 정보 전송 (백엔드 구현 필요)
        await this.sendSubscriptionToServer(this.pushSubscription)
      }
    } catch (error) {
      console.error('Failed to subscribe to push:', error)
    }
  }
  
  // Base64 URL을 Uint8Array로 변환
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
  
  // 서버에 구독 정보 전송
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    // 백엔드 엔드포인트가 준비되면 구현
    // const response = await fetch('/api/push-subscription', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription)
    // })
    console.log('Push subscription would be sent to server:', subscription)
  }
  
  // IndexedDB 초기화
  private async initIndexedDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('PlannerDB', 1)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        console.log('IndexedDB initialized')
        resolve()
      }
      
      request.onupgradeneeded = (event: any) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains('tasks')) {
          db.createObjectStore('tasks', { keyPath: 'id' })
        }
      }
    })
  }

  // 알림 권한 요청
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications')
      return false
    }

    try {
      this.permission = await Notification.requestPermission()
      console.log('Notification permission:', this.permission)
      return this.permission === 'granted'
    } catch (error) {
      console.error('Error requesting notification permission:', error)
      return false
    }
  }

  // 알림 권한 상태 확인
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied'
    }
    return Notification.permission
  }

  // 즉시 알림 전송
  async sendNotification(title: string, options?: NotificationOptions): Promise<void> {
    if (this.getPermissionStatus() !== 'granted') {
      console.log('Notification permission not granted')
      return
    }

    if (!this.registration) {
      await this.register()
    }

    if (this.registration) {
      await this.registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options
      } as any)
    }
  }

  // 오늘의 일정 알림
  async sendDailyBriefing(tasks: Task[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const todayTasks = tasks.filter(task => 
      task.startDate <= today && task.endDate >= today && !task.completed
    )
    
    // Service Worker에 작업 데이터 동기화
    await this.syncTasksToServiceWorker(tasks)

    if (todayTasks.length === 0) {
      await this.sendNotification('📅 오늘의 일정', {
        body: '오늘은 예정된 일정이 없습니다. 편안한 하루 보내세요!',
        tag: 'daily-briefing'
      })
      return
    }

    const taskList = todayTasks.slice(0, 3).map(task => `• ${task.title}`).join('\n')
    const moreText = todayTasks.length > 3 ? `\n...외 ${todayTasks.length - 3}개` : ''

    await this.sendNotification('🌅 좋은 아침입니다!', {
      body: `오늘의 할 일 (${todayTasks.length}개)\n${taskList}${moreText}`,
      tag: 'daily-briefing',
      requireInteraction: true,
      actions: [
        { action: 'open', title: '플래너 열기' },
        { action: 'dismiss', title: '닫기' }
      ]
    } as any)
  }
  
  // Service Worker에 작업 동기화
  private async syncTasksToServiceWorker(tasks: Task[]): Promise<void> {
    if (!navigator.serviceWorker.controller) return
    
    navigator.serviceWorker.controller.postMessage({
      type: 'SYNC_TASKS',
      tasks: tasks
    })
  }

  // 마감 임박 알림
  async sendDeadlineReminder(task: Task): Promise<void> {
    const now = new Date()
    const deadline = new Date(task.endDate)
    const hoursLeft = Math.floor((deadline.getTime() - now.getTime()) / (1000 * 60 * 60))

    await this.sendNotification('⏰ 마감 임박!', {
      body: `"${task.title}"\n마감: ${hoursLeft}시간 남음`,
      tag: `deadline-${task.id}`,
      requireInteraction: true
    } as any)
  }

  // 일일 요약 알림
  async sendDailySummary(tasks: Task[]): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const todayTasks = tasks.filter(task => 
      task.startDate <= today && task.endDate >= today
    )
    
    const completed = todayTasks.filter(t => t.completed).length
    const total = todayTasks.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    const emoji = percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'

    await this.sendNotification('📊 오늘의 성과', {
      body: `완료: ${completed}/${total} (${percentage}%)\n${emoji} ${
        percentage >= 80 ? '훌륭해요!' : 
        percentage >= 50 ? '잘하고 있어요!' : 
        '조금만 더 힘내세요!'
      }`,
      tag: 'daily-summary'
    })
  }

  // 알림 예약 (Background Sync API)
  async scheduleNotification(tag: string, options?: any): Promise<void> {
    if (!this.registration) {
      await this.register()
    }

    if ('periodicSync' in ServiceWorkerRegistration.prototype) {
      try {
        // @ts-ignore - Periodic Background Sync is experimental
        await this.registration?.periodicSync.register(tag, {
          minInterval: 24 * 60 * 60 * 1000, // 24 hours
          ...options
        })
        console.log(`Periodic sync registered: ${tag}`)
      } catch (error) {
        console.error('Periodic sync registration failed:', error)
        // Fallback to regular intervals
        this.scheduleWithInterval(tag)
      }
    } else {
      console.log('Periodic Background Sync not supported')
      // Fallback: use setInterval
      this.scheduleWithInterval(tag)
    }
  }
  
  // Fallback scheduling with setInterval
  private scheduleWithInterval(tag: string): void {
    const settings = this.getSettings()
    
    if (tag === 'daily-briefing' && settings.dailyBriefing) {
      // 매일 지정된 시간에 실행
      const [hours, minutes] = settings.dailyBriefingTime.split(':').map(Number)
      this.scheduleDaily(hours, minutes, () => {
        // @ts-ignore
        this.sendDailyBriefing(window.useStore?.getState?.()?.tasks || [])
      })
    } else if (tag === 'daily-summary' && settings.dailySummary) {
      const [hours, minutes] = settings.dailySummaryTime.split(':').map(Number)
      this.scheduleDaily(hours, minutes, () => {
        // @ts-ignore
        this.sendDailySummary(window.useStore?.getState?.()?.tasks || [])
      })
    }
  }
  
  // 매일 특정 시간에 실행
  private scheduleDaily(hours: number, minutes: number, callback: () => void): void {
    const now = new Date()
    const scheduled = new Date()
    scheduled.setHours(hours, minutes, 0, 0)
    
    // 이미 시간이 지났으면 내일로 설정
    if (scheduled <= now) {
      scheduled.setDate(scheduled.getDate() + 1)
    }
    
    const timeout = scheduled.getTime() - now.getTime()
    
    setTimeout(() => {
      callback()
      // 24시간마다 반복
      setInterval(callback, 24 * 60 * 60 * 1000)
    }, timeout)
  }

  // Push 알림 테스트
  async testPushNotification(): Promise<void> {
    if (!this.pushSubscription) {
      console.error('No push subscription available')
      return
    }
    
    // 테스트 알림 전송
    await this.sendNotification('🧪 테스트 알림', {
      body: '푸시 알림이 정상적으로 작동합니다!',
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      tag: 'test-notification',
      requireInteraction: false
    })
  }

  // 알림 설정 저장
  saveSettings(settings: NotificationSettings): void {
    localStorage.setItem('notification-settings', JSON.stringify(settings))
  }

  // 알림 설정 불러오기
  getSettings(): NotificationSettings {
    const stored = localStorage.getItem('notification-settings')
    if (stored) {
      return JSON.parse(stored)
    }
    
    // 기본 설정
    return {
      enabled: false,
      dailyBriefing: true,
      dailyBriefingTime: '08:00',
      deadlineReminder: true,
      deadlineReminderHours: 1,
      dailySummary: true,
      dailySummaryTime: '21:00',
      sound: true,
      vibration: true
    }
  }
}

interface NotificationSettings {
  enabled: boolean
  dailyBriefing: boolean
  dailyBriefingTime: string
  deadlineReminder: boolean
  deadlineReminderHours: number
  dailySummary: boolean
  dailySummaryTime: string
  sound: boolean
  vibration: boolean
}

// Singleton instance
export const notificationManager = new NotificationManager()