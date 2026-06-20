// Database manager for push subscriptions
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'

let db = null

export async function initDatabase() {
  if (db) return db
  
  db = await open({
    filename: process.env.DATABASE_PATH || './database.db',
    driver: sqlite3.Database
  })

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT UNIQUE NOT NULL,
      endpoint TEXT UNIQUE NOT NULL,
      keys_auth TEXT NOT NULL,
      keys_p256dh TEXT NOT NULL,
      user_agent TEXT,
      device_info TEXT,
      notification_settings TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_active DATETIME DEFAULT CURRENT_TIMESTAMP,
      is_active BOOLEAN DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS notification_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id TEXT,
      type TEXT,
      title TEXT,
      body TEXT,
      status TEXT,
      error_message TEXT,
      sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks_cache (
      device_id TEXT PRIMARY KEY,
      tasks TEXT,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_device_id ON subscriptions(device_id);
    CREATE INDEX IF NOT EXISTS idx_endpoint ON subscriptions(endpoint);
    CREATE INDEX IF NOT EXISTS idx_active ON subscriptions(is_active);
  `)

  console.log('Database initialized')
  return db
}

// Save or update subscription
export async function saveSubscription(deviceId, subscription, userAgent, settings = {}) {
  const db = await initDatabase()
  
  const { endpoint, keys } = subscription
  
  await db.run(`
    INSERT INTO subscriptions (
      device_id, endpoint, keys_auth, keys_p256dh, 
      user_agent, notification_settings, last_active
    ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(device_id) DO UPDATE SET
      endpoint = excluded.endpoint,
      keys_auth = excluded.keys_auth,
      keys_p256dh = excluded.keys_p256dh,
      user_agent = excluded.user_agent,
      notification_settings = excluded.notification_settings,
      last_active = CURRENT_TIMESTAMP,
      is_active = 1
  `, [
    deviceId,
    endpoint,
    keys.auth,
    keys.p256dh,
    userAgent,
    JSON.stringify(settings)
  ])
  
  return { success: true, deviceId }
}

// Get subscription by device ID
export async function getSubscription(deviceId) {
  const db = await initDatabase()
  
  const subscription = await db.get(`
    SELECT * FROM subscriptions 
    WHERE device_id = ? AND is_active = 1
  `, deviceId)
  
  if (!subscription) return null
  
  return {
    endpoint: subscription.endpoint,
    keys: {
      auth: subscription.keys_auth,
      p256dh: subscription.keys_p256dh
    },
    settings: JSON.parse(subscription.notification_settings || '{}')
  }
}

// Get all active subscriptions
export async function getAllSubscriptions() {
  const db = await initDatabase()
  
  const subscriptions = await db.all(`
    SELECT * FROM subscriptions 
    WHERE is_active = 1
    ORDER BY last_active DESC
  `)
  
  return subscriptions.map(sub => ({
    deviceId: sub.device_id,
    subscription: {
      endpoint: sub.endpoint,
      keys: {
        auth: sub.keys_auth,
        p256dh: sub.keys_p256dh
      }
    },
    settings: JSON.parse(sub.notification_settings || '{}'),
    lastActive: sub.last_active
  }))
}

// Mark subscription as inactive
export async function removeSubscription(deviceId) {
  const db = await initDatabase()
  
  await db.run(`
    UPDATE subscriptions 
    SET is_active = 0 
    WHERE device_id = ?
  `, deviceId)
  
  return { success: true }
}

// Log notification
export async function logNotification(deviceId, type, title, body, status, errorMessage = null) {
  const db = await initDatabase()
  
  await db.run(`
    INSERT INTO notification_log (
      device_id, type, title, body, status, error_message
    ) VALUES (?, ?, ?, ?, ?, ?)
  `, [deviceId, type, title, body, status, errorMessage])
}

// Save tasks for device (for offline support)
export async function saveTasks(deviceId, tasks) {
  const db = await initDatabase()
  
  await db.run(`
    INSERT INTO tasks_cache (device_id, tasks, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(device_id) DO UPDATE SET
      tasks = excluded.tasks,
      updated_at = CURRENT_TIMESTAMP
  `, [deviceId, JSON.stringify(tasks)])
}

// Get tasks for device
export async function getTasks(deviceId) {
  const db = await initDatabase()
  
  const result = await db.get(`
    SELECT tasks FROM tasks_cache
    WHERE device_id = ?
  `, deviceId)
  
  return result ? JSON.parse(result.tasks) : []
}

// Clean up old inactive subscriptions
export async function cleanupInactiveSubscriptions(daysOld = 30) {
  const db = await initDatabase()
  
  await db.run(`
    DELETE FROM subscriptions
    WHERE is_active = 0 
    AND datetime(last_active) < datetime('now', '-${daysOld} days')
  `)
  
  const result = await db.get('SELECT changes() as count')
  return result.count
}