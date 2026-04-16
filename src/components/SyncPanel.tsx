import { useStore } from '../store/useStore'
import { signOut } from '../utils/googleDrive'

interface SyncPanelProps {
  isOpen: boolean
  onClose: () => void
  onLogout: () => void
}

export function SyncPanel({ isOpen, onClose, onLogout }: SyncPanelProps) {
  const { syncToDrive, syncFromDrive, lastSyncTime, isSyncing } = useStore()

  const handleUpload = async () => {
    try {
      await syncToDrive()
      onClose()
    } catch (e) {
      console.error('Upload failed:', e)
    }
  }

  const handleDownload = async () => {
    try {
      await syncFromDrive()
      onClose()
    } catch (e) {
      console.error('Download failed:', e)
    }
  }

  const handleLogout = () => {
    signOut()
    onLogout()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-[280px] bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 flex items-center justify-between">
          <span className="w-6" />
          <h3 className="text-base font-semibold text-gray-800 dark:text-white">Google Drive 동기화</h3>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3 space-y-2">
          <button
            onClick={handleUpload}
            disabled={isSyncing}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-xl disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <span className="font-medium">Drive에 업로드</span>
          </button>
          <button
            onClick={handleDownload}
            disabled={isSyncing}
            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 rounded-xl disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="font-medium">Drive에서 다운로드</span>
          </button>
        </div>
        {lastSyncTime && (
          <div className="px-4 py-2 bg-gray-50 dark:bg-slate-700/50">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              마지막 동기화: {new Date(lastSyncTime).toLocaleString('ko-KR')}
            </p>
          </div>
        )}
        <div className="p-3 border-t border-gray-100 dark:border-slate-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-xl"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            로그아웃
          </button>
        </div>
        {isSyncing && (
          <div className="absolute inset-0 bg-white/80 dark:bg-slate-800/80 flex items-center justify-center">
            <div className="flex items-center gap-2 text-blue-500">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                <path fill="currentColor" className="opacity-75" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-sm font-medium">동기화 중...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
