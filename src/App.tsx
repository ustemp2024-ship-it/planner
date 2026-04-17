import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { Calendar } from './components/Calendar'
import { CategoryManager } from './components/CategoryManager'
import { StatsPanel } from './components/StatsPanel'
import { ReminderChecker } from './components/ReminderChecker'
import { SummaryBar } from './components/SummaryBar'
import { CategoryFilter } from './components/CategoryFilter'
import { SelectionToolbar } from './components/SelectionToolbar'
import { SyncButton } from './components/SyncButton'
import { SyncPanel } from './components/SyncPanel'
import { LoginPage } from './components/LoginPage'
import { UserProfile } from './components/UserProfile'
import { AuthDebug } from './components/AuthDebug'
import { EmptyState } from './components/EmptyState'
import { ConflictNotification } from './components/ConflictNotification'
import { useStore } from './store/useStore'
import { useAuthStore } from './store/useAuthStore'
import { useAutoSync } from './hooks/useAutoSync'

function App() {
  const [showCategoryManager, setShowCategoryManager] = useState(false)
  const [showStats, setShowStats] = useState(false)
  const [showMenu, setShowMenu] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [showSyncPanel, setShowSyncPanel] = useState(false)
  const [isSyncLoggedIn, setIsSyncLoggedIn] = useState(false)
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set())
  const [draggedTask, setDraggedTask] = useState<string | null>(null)
  const { exportData, importData, loadUserData, tasks, categories, hiddenCategories, markAllTasksComplete, hasConflicts, clearConflicts } = useStore()
  const { isAuthenticated, isInitialized, initializeAuth } = useAuthStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const toggleTaskSelection = useCallback((taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) {
        next.delete(taskId)
      } else {
        next.add(taskId)
      }
      return next
    })
  }, [])

  const clearSelection = useCallback(() => {
    setSelectedTasks(new Set())
  }, [])

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false)
    setSelectedTasks(new Set())
  }, [])

  useEffect(() => {
    initializeAuth()
    
    // 개발자 도구에서 데이터 초기화용 전역 함수
    if (typeof window !== 'undefined') {
      (window as any).clearPlannerData = () => {
        localStorage.removeItem('planner-google-token')
        sessionStorage.removeItem('planner-google-token')
        localStorage.removeItem('planner-storage')
        console.log('Planner data cleared! Please refresh the page.')
        window.location.reload()
      }
      console.log('Debug: Use clearPlannerData() in console to clear current user data')
    }
  }, [initializeAuth])

  useEffect(() => {
    if (isAuthenticated) {
      loadUserData()
    }
  }, [isAuthenticated, loadUserData])

  useAutoSync(isSyncLoggedIn)

  const completionRate = useMemo(() => {
    const completedCount = tasks.filter(t => t.completed).length
    const totalCount = tasks.length
    return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  }, [tasks])

  const handleExport = useCallback(() => {
    const data = exportData()
    const blob = new Blob([data], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `planner-backup-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
    setShowMenu(false)
  }, [exportData])

  const handleImport = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        const content = event.target?.result as string
        importData(content)
      }
      reader.readAsText(file)
    }
    setShowMenu(false)
  }, [importData])

  // 인증 초기화 중이면 로딩 화면 표시
  if (!isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-slate-300 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400">초기화 중...</p>
        </div>
      </div>
    )
  }

  // 인증되지 않은 경우 로그인 페이지 표시
  if (!isAuthenticated) {
    return <LoginPage />
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-800">
      <AuthDebug />
      <header className="flex items-center justify-between px-4 py-3 glass border-b border-white/20 dark:border-slate-700/50 safe-area-top shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              플래너
            </h1>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <span>{categories.length} 카테고리</span>
              <span>•</span>
              <span>{tasks.length} 할일</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <UserProfile />
          
          <SyncButton 
            onOpenPanel={() => setShowSyncPanel(true)}
            onLoggedInChange={setIsSyncLoggedIn}
          />
          
          <button
            onClick={() => setShowStats(true)}
            className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 active:scale-95"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm font-semibold">{completionRate}%</span>
          </button>
          
          <button
            onClick={() => setShowFilter(true)}
            className="relative p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-200/50 dark:border-slate-700/50 active:scale-95"
            title="필터"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            {hiddenCategories.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {hiddenCategories.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setShowCategoryManager(true)}
            className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-200/50 dark:border-slate-700/50 active:scale-95"
            title="카테고리"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2.5 rounded-xl bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-md border border-slate-200/50 dark:border-slate-700/50 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>
            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 glass rounded-2xl shadow-2xl border border-white/20 dark:border-slate-700/50 z-50 overflow-hidden animate-fade-in">
                <button
                  onClick={handleExport}
                  className="w-full px-4 py-3.5 text-left text-sm hover:bg-white/50 dark:hover:bg-slate-700/50 dark:text-white flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  </div>
                  데이터 내보내기
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full px-4 py-3.5 text-left text-sm hover:bg-white/50 dark:hover:bg-slate-700/50 dark:text-white flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </div>
                  데이터 가져오기
                </button>
                <button
                  onClick={() => { markAllTasksComplete(); setShowMenu(false) }}
                  className="w-full px-4 py-3.5 text-left text-sm hover:bg-white/50 dark:hover:bg-slate-700/50 dark:text-white flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  모두 완료 처리
                </button>
                <button
                  onClick={() => { setSelectionMode(true); setShowMenu(false) }}
                  className="w-full px-4 py-3.5 text-left text-sm hover:bg-white/50 dark:hover:bg-slate-700/50 dark:text-white flex items-center gap-3 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/50 flex items-center justify-center">
                    <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  다중 선택 삭제
                </button>
              </div>
            )}
          </div>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleImport}
          className="hidden"
        />
      </header>

      <SummaryBar />

      <div className="relative flex-1 overflow-auto min-h-0">
        {categories.length === 0 ? (
          <EmptyState 
            type="welcome" 
            onCreateCategory={() => setShowCategoryManager(true)}
          />
        ) : (
          <Calendar
            selectionMode={selectionMode}
            selectedTasks={selectedTasks}
            onToggleSelection={toggleTaskSelection}
            draggedTaskId={draggedTask}
            onDragStart={setDraggedTask}
            onDragEnd={() => setDraggedTask(null)}
          />
        )}
        
        {isSyncLoggedIn && (
          <SyncPanel
            isOpen={showSyncPanel}
            onClose={() => setShowSyncPanel(false)}
            onLogout={() => setIsSyncLoggedIn(false)}
          />
        )}
      </div>

      <CategoryManager
        isOpen={showCategoryManager}
        onClose={() => setShowCategoryManager(false)}
      />

      <StatsPanel
        isOpen={showStats}
        onClose={() => setShowStats(false)}
      />

      <CategoryFilter
        isOpen={showFilter}
        onClose={() => setShowFilter(false)}
      />

      <ReminderChecker />

      {selectionMode && (
        <SelectionToolbar
          selectedTasks={selectedTasks}
          onClearSelection={clearSelection}
          onExitSelectionMode={exitSelectionMode}
        />
      )}

      {showMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowMenu(false)}
        />
      )}
      
      <ConflictNotification 
        isVisible={hasConflicts} 
        onClose={clearConflicts} 
      />
    </div>
  )
}

export default App
