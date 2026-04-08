import { useEffect, useState } from 'react'
import { useStore } from '../store/useStore'
import type { Task } from '../types'

export function ReminderChecker() {
  const { tasks, categories } = useStore()
  const [reminders, setReminders] = useState<Task[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    const todayReminders = tasks.filter(
      t => t.reminderDate === today && !t.completed && !dismissed.has(t.id)
    )
    setReminders(todayReminders)

    if ('Notification' in window && Notification.permission === 'granted' && todayReminders.length > 0) {
      todayReminders.forEach(task => {
        const cat = categories.find(c => c.id === task.categoryId)
        new Notification('플래너 알림', {
          body: `${cat?.name || ''}: ${task.title}`,
          icon: '/icon-192.png',
          tag: task.id
        })
      })
    }
  }, [tasks, categories, dismissed])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const handleDismiss = (taskId: string) => {
    setDismissed(prev => new Set([...prev, taskId]))
  }

  const handleDismissAll = () => {
    setDismissed(prev => new Set([...prev, ...reminders.map(r => r.id)]))
  }

  if (reminders.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 left-4 md:left-auto md:w-80 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="p-4 bg-gradient-to-r from-orange-500 to-amber-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <span className="font-bold">오늘의 알림</span>
            </div>
            <button
              onClick={handleDismissAll}
              className="text-white/80 hover:text-white text-sm"
            >
              모두 닫기
            </button>
          </div>
        </div>
        <div className="max-h-60 overflow-y-auto">
          {reminders.map(task => {
            const cat = categories.find(c => c.id === task.categoryId)
            return (
              <div
                key={task.id}
                className="p-3 border-b border-gray-100 dark:border-gray-700 last:border-0 flex items-center gap-3"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat?.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="font-medium dark:text-white text-sm truncate">{task.title}</div>
                  <div className="text-xs text-gray-500">{cat?.name}</div>
                </div>
                <button
                  onClick={() => handleDismiss(task.id)}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
