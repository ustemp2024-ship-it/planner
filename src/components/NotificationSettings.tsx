import { useState, useEffect } from 'react'
import { notificationManager } from '../utils/notifications'
import { useStore } from '../store/useStore'

interface NotificationSettingsProps {
  isOpen: boolean
  onClose: () => void
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  const { tasks } = useStore()
  const [permission, setPermission] = useState<NotificationPermission>('default')
  const [settings, setSettings] = useState({
    enabled: false,
    dailyBriefing: true,
    dailyBriefingTime: '08:00',
    deadlineReminder: true,
    deadlineReminderHours: 1,
    dailySummary: true,
    dailySummaryTime: '21:00',
    sound: true,
    vibration: true
  })

  useEffect(() => {
    setPermission(notificationManager.getPermissionStatus())
    setSettings(notificationManager.getSettings())
  }, [])

  const handleRequestPermission = async () => {
    const granted = await notificationManager.requestPermission()
    setPermission(granted ? 'granted' : 'denied')
    if (granted) {
      setSettings(prev => ({ ...prev, enabled: true }))
      await notificationManager.register()
    }
  }

  const handleSaveSettings = () => {
    notificationManager.saveSettings(settings)
    
    if (settings.enabled && settings.dailyBriefing) {
      notificationManager.scheduleNotification('daily-briefing')
    }
    
    onClose()
  }

  const handleTestNotification = () => {
    notificationManager.sendDailyBriefing(tasks)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4 text-slate-900 dark:text-white">
          🔔 알림 설정
        </h2>

        {/* 권한 상태 */}
        <div className="mb-6 p-4 rounded-lg bg-slate-50 dark:bg-slate-700">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              알림 권한 상태
            </span>
            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
              permission === 'granted' 
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : permission === 'denied'
                ? 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300'
            }`}>
              {permission === 'granted' ? '✅ 허용됨' : 
               permission === 'denied' ? '❌ 거부됨' : '⏸ 대기중'}
            </span>
          </div>
          
          {permission !== 'granted' && (
            <button
              onClick={handleRequestPermission}
              className="w-full mt-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              알림 권한 요청
            </button>
          )}
        </div>

        {permission === 'granted' && (
          <>
            {/* 알림 활성화 */}
            <div className="mb-4">
              <label className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  알림 사용
                </span>
                <input
                  type="checkbox"
                  checked={settings.enabled}
                  onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>
            </div>

            {settings.enabled && (
              <>
                {/* 아침 브리핑 */}
                <div className="mb-4 p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      🌅 아침 브리핑
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.dailyBriefing}
                      onChange={(e) => setSettings(prev => ({ ...prev, dailyBriefing: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  {settings.dailyBriefing && (
                    <input
                      type="time"
                      value={settings.dailyBriefingTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, dailyBriefingTime: e.target.value }))}
                      className="w-full mt-2 px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  )}
                </div>

                {/* 마감 알림 */}
                <div className="mb-4 p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      ⏰ 마감 임박 알림
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.deadlineReminder}
                      onChange={(e) => setSettings(prev => ({ ...prev, deadlineReminder: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  {settings.deadlineReminder && (
                    <select
                      value={settings.deadlineReminderHours}
                      onChange={(e) => setSettings(prev => ({ ...prev, deadlineReminderHours: Number(e.target.value) }))}
                      className="w-full mt-2 px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    >
                      <option value={1}>1시간 전</option>
                      <option value={2}>2시간 전</option>
                      <option value={3}>3시간 전</option>
                      <option value={24}>1일 전</option>
                    </select>
                  )}
                </div>

                {/* 일일 요약 */}
                <div className="mb-6 p-3 border border-slate-200 dark:border-slate-600 rounded-lg">
                  <label className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                      📊 일일 요약
                    </span>
                    <input
                      type="checkbox"
                      checked={settings.dailySummary}
                      onChange={(e) => setSettings(prev => ({ ...prev, dailySummary: e.target.checked }))}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </label>
                  {settings.dailySummary && (
                    <input
                      type="time"
                      value={settings.dailySummaryTime}
                      onChange={(e) => setSettings(prev => ({ ...prev, dailySummaryTime: e.target.value }))}
                      className="w-full mt-2 px-3 py-1 text-sm border border-slate-200 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                    />
                  )}
                </div>

                {/* 테스트 알림 */}
                <button
                  onClick={handleTestNotification}
                  className="w-full mb-4 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  🧪 테스트 알림 보내기
                </button>
              </>
            )}
          </>
        )}

        {/* 액션 버튼 */}
        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSaveSettings}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            저장
          </button>
        </div>
      </div>
    </div>
  )
}