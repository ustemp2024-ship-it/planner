// Push notification server for Planner app
import express from 'express'
import webpush from 'web-push'
import cors from 'cors'
import dotenv from 'dotenv'
import cron from 'node-cron'
import {
  initDatabase,
  saveSubscription,
  getSubscription,
  getAllSubscriptions,
  removeSubscription,
  logNotification,
  saveTasks,
  getTasks,
  cleanupInactiveSubscriptions
} from './database.js'

// Load environment variables
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true
}))

// Configure web-push
webpush.setVapidDetails(
  process.env.VAPID_EMAIL,
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
)

// Initialize database
await initDatabase()

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Get VAPID public key
app.get('/api/push/vapid-key', (req, res) => {
  res.json({ publicKey: process.env.VAPID_PUBLIC_KEY })
})

// Subscribe to push notifications
app.post('/api/push/subscribe', async (req, res) => {
  try {
    const { deviceId, subscription, settings = {} } = req.body
    const userAgent = req.headers['user-agent']
    
    if (!deviceId || !subscription) {
      return res.status(400).json({ error: 'Missing deviceId or subscription' })
    }
    
    const result = await saveSubscription(deviceId, subscription, userAgent, settings)
    
    // Send welcome notification
    await sendNotification(deviceId, {
      title: '🎉 알림 설정 완료!',
      body: '플래너 알림이 활성화되었습니다. 일정 알림을 받아보세요.',
      type: 'welcome'
    })
    
    res.json(result)
  } catch (error) {
    console.error('Subscribe error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Unsubscribe from push notifications
app.post('/api/push/unsubscribe', async (req, res) => {
  try {
    const { deviceId } = req.body
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId' })
    }
    
    const result = await removeSubscription(deviceId)
    res.json(result)
  } catch (error) {
    console.error('Unsubscribe error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Update notification settings
app.post('/api/push/settings', async (req, res) => {
  try {
    const { deviceId, settings } = req.body
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId' })
    }
    
    const subscription = await getSubscription(deviceId)
    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' })
    }
    
    await saveSubscription(deviceId, subscription, req.headers['user-agent'], settings)
    res.json({ success: true })
  } catch (error) {
    console.error('Settings update error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Sync tasks for offline support
app.post('/api/push/sync-tasks', async (req, res) => {
  try {
    const { deviceId, tasks } = req.body
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId' })
    }
    
    await saveTasks(deviceId, tasks)
    res.json({ success: true })
  } catch (error) {
    console.error('Task sync error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Send test notification
app.post('/api/push/test', async (req, res) => {
  try {
    const { deviceId } = req.body
    
    if (!deviceId) {
      return res.status(400).json({ error: 'Missing deviceId' })
    }
    
    const result = await sendNotification(deviceId, {
      title: '🧪 테스트 알림',
      body: '푸시 알림이 정상적으로 작동합니다!',
      type: 'test',
      requireInteraction: false
    })
    
    res.json(result)
  } catch (error) {
    console.error('Test notification error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Send notification to specific device
app.post('/api/push/send', async (req, res) => {
  try {
    const { deviceId, notification } = req.body
    
    if (!deviceId || !notification) {
      return res.status(400).json({ error: 'Missing deviceId or notification' })
    }
    
    const result = await sendNotification(deviceId, notification)
    res.json(result)
  } catch (error) {
    console.error('Send notification error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Broadcast notification to all devices
app.post('/api/push/broadcast', async (req, res) => {
  try {
    const { notification } = req.body
    
    if (!notification) {
      return res.status(400).json({ error: 'Missing notification' })
    }
    
    const results = await broadcastNotification(notification)
    res.json(results)
  } catch (error) {
    console.error('Broadcast error:', error)
    res.status(500).json({ error: error.message })
  }
})

// Helper function to send notification
async function sendNotification(deviceId, notification) {
  try {
    const subscription = await getSubscription(deviceId)
    
    if (!subscription) {
      return { success: false, error: 'Subscription not found' }
    }
    
    const payload = JSON.stringify({
      title: notification.title,
      body: notification.body,
      icon: notification.icon || '/icon-192.png',
      badge: notification.badge || '/icon-192.png',
      tag: notification.tag || `notification-${Date.now()}`,
      data: notification.data || {},
      requireInteraction: notification.requireInteraction !== undefined ? notification.requireInteraction : true,
      silent: notification.silent || false
    })
    
    await webpush.sendNotification(subscription, payload)
    
    await logNotification(
      deviceId,
      notification.type || 'manual',
      notification.title,
      notification.body,
      'success'
    )
    
    return { success: true, deviceId }
  } catch (error) {
    console.error(`Failed to send notification to ${deviceId}:`, error)
    
    await logNotification(
      deviceId,
      notification.type || 'manual',
      notification.title,
      notification.body,
      'failed',
      error.message
    )
    
    // If subscription is no longer valid, mark as inactive
    if (error.statusCode === 410) {
      await removeSubscription(deviceId)
    }
    
    return { success: false, deviceId, error: error.message }
  }
}

// Broadcast to all active subscriptions
async function broadcastNotification(notification) {
  const subscriptions = await getAllSubscriptions()
  const results = []
  
  for (const sub of subscriptions) {
    const result = await sendNotification(sub.deviceId, notification)
    results.push(result)
  }
  
  return {
    total: subscriptions.length,
    successful: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    results
  }
}

// Send daily briefing
async function sendDailyBriefing() {
  console.log('Sending daily briefing notifications...')
  
  const subscriptions = await getAllSubscriptions()
  
  for (const sub of subscriptions) {
    const settings = sub.settings
    
    if (!settings.dailyBriefing) continue
    
    const tasks = await getTasks(sub.deviceId)
    const today = new Date().toISOString().split('T')[0]
    const todayTasks = tasks.filter(task => 
      task.startDate <= today && task.endDate >= today && !task.completed
    )
    
    let notification
    
    if (todayTasks.length > 0) {
      const taskList = todayTasks.slice(0, 3).map(t => `• ${t.title}`).join('\n')
      const moreText = todayTasks.length > 3 ? `\n...외 ${todayTasks.length - 3}개` : ''
      
      notification = {
        title: '🌅 좋은 아침입니다!',
        body: `오늘의 할 일 (${todayTasks.length}개)\n${taskList}${moreText}`,
        type: 'daily-briefing',
        requireInteraction: true
      }
    } else {
      notification = {
        title: '📅 오늘의 일정',
        body: '오늘은 예정된 일정이 없습니다. 편안한 하루 보내세요!',
        type: 'daily-briefing',
        requireInteraction: false
      }
    }
    
    await sendNotification(sub.deviceId, notification)
  }
}

// Send daily summary
async function sendDailySummary() {
  console.log('Sending daily summary notifications...')
  
  const subscriptions = await getAllSubscriptions()
  
  for (const sub of subscriptions) {
    const settings = sub.settings
    
    if (!settings.dailySummary) continue
    
    const tasks = await getTasks(sub.deviceId)
    const today = new Date().toISOString().split('T')[0]
    const todayTasks = tasks.filter(task => 
      task.startDate <= today && task.endDate >= today
    )
    
    const completed = todayTasks.filter(t => t.completed).length
    const total = todayTasks.length
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0
    
    const emoji = percentage >= 80 ? '🎉' : percentage >= 50 ? '👍' : '💪'
    const message = percentage >= 80 ? '훌륭해요!' : 
                    percentage >= 50 ? '잘하고 있어요!' : 
                    '조금만 더 힘내세요!'
    
    const notification = {
      title: '📊 오늘의 성과',
      body: `완료: ${completed}/${total} (${percentage}%)\n${emoji} ${message}`,
      type: 'daily-summary',
      requireInteraction: false
    }
    
    await sendNotification(sub.deviceId, notification)
  }
}

// Check for deadline reminders
async function checkDeadlines() {
  console.log('Checking for deadline reminders...')
  
  const subscriptions = await getAllSubscriptions()
  
  for (const sub of subscriptions) {
    const settings = sub.settings
    
    if (!settings.deadlineReminder) continue
    
    const tasks = await getTasks(sub.deviceId)
    const now = new Date()
    const reminderHours = settings.deadlineReminderHours || 24
    const reminderTime = new Date(now.getTime() + reminderHours * 60 * 60 * 1000)
    
    const upcomingTasks = tasks.filter(task => {
      const deadline = new Date(task.endDate)
      return deadline > now && deadline <= reminderTime && !task.completed
    })
    
    for (const task of upcomingTasks) {
      const deadline = new Date(task.endDate)
      const hoursLeft = Math.floor((deadline - now) / (1000 * 60 * 60))
      
      const notification = {
        title: '⏰ 마감 임박!',
        body: `"${task.title}"\n마감까지 ${hoursLeft}시간 남음`,
        type: 'deadline-reminder',
        tag: `deadline-${task.id}`,
        data: { taskId: task.id },
        requireInteraction: true
      }
      
      await sendNotification(sub.deviceId, notification)
    }
  }
}

// Schedule cron jobs
const DAILY_BRIEFING_HOUR = process.env.DAILY_BRIEFING_HOUR || 8
const DAILY_SUMMARY_HOUR = process.env.DAILY_SUMMARY_HOUR || 21

// Daily briefing (default 8 AM)
cron.schedule(`0 ${DAILY_BRIEFING_HOUR} * * *`, sendDailyBriefing)

// Daily summary (default 9 PM)
cron.schedule(`0 ${DAILY_SUMMARY_HOUR} * * *`, sendDailySummary)

// Deadline check (every hour)
cron.schedule('0 * * * *', checkDeadlines)

// Cleanup old subscriptions (daily at 3 AM)
cron.schedule('0 3 * * *', async () => {
  const deleted = await cleanupInactiveSubscriptions()
  console.log(`Cleaned up ${deleted} inactive subscriptions`)
})

// Start server
app.listen(PORT, () => {
  console.log(`Push notification server running on port ${PORT}`)
  console.log(`VAPID Public Key: ${process.env.VAPID_PUBLIC_KEY}`)
  console.log(`Scheduled notifications:`)
  console.log(`  - Daily briefing: ${DAILY_BRIEFING_HOUR}:00`)
  console.log(`  - Daily summary: ${DAILY_SUMMARY_HOUR}:00`)
  console.log(`  - Deadline check: Every hour`)
})