// Push Notification Manager
import type { Task } from '../types'

export class NotificationManager {
  private registration: ServiceWorkerRegistration | null = null
  private permission: NotificationPermission = 'default'

  // Service Worker 등록
  async register(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.register('/service-worker.js')
        console.log('Service Worker registered:', this.registration)
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
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
      tag: 'daily-briefing'
    } as any)
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
      }
    } else {
      console.log('Periodic Background Sync not supported')
      // Fallback: use setTimeout for next day
      this.scheduleWithTimeout(tag)
    }
  }

  // Fallback scheduling with setTimeout
  private scheduleWithTimeout(tag: string): void {
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(8, 0, 0, 0) // 내일 오전 8시

    const timeUntilTomorrow = tomorrow.getTime() - now.getTime()

    setTimeout(() => {
      this.sendDailyBriefing([]) // Fetch tasks from store
      this.scheduleWithTimeout(tag) // Reschedule for next day
    }, timeUntilTomorrow)
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