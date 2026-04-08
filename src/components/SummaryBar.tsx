import { useMemo } from 'react'
import { useStore } from '../store/useStore'

export function SummaryBar() {
  const { tasks, categories, currentYear } = useStore()

  const stats = useMemo(() => {
    const now = new Date()
    const isCurrentYear = currentYear === now.getFullYear()
    
    const todayMonth = now.getMonth() + 1
    const todayDay = now.getDate()
    
    const today = isCurrentYear 
      ? now.toISOString().split('T')[0]
      : `${currentYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`
    
    const weekAgo = new Date(currentYear, todayMonth - 1, todayDay - 7)
    const weekAgoStr = weekAgo.toISOString().split('T')[0]
    
    const monthStart = `${currentYear}-${String(todayMonth).padStart(2, '0')}-01`
    const monthEnd = `${currentYear}-${String(todayMonth).padStart(2, '0')}-31`

    const todayTasks = tasks.filter(t => t.startDate <= today && t.endDate >= today)
    const todayCompleted = todayTasks.filter(t => t.completed).length
    const todayTotal = todayTasks.length

    const weekTasks = tasks.filter(t => t.startDate >= weekAgoStr && t.startDate <= today)
    const weekCompleted = weekTasks.filter(t => t.completed).length
    const weekTotal = weekTasks.length
    const weekRate = weekTotal > 0 ? Math.round((weekCompleted / weekTotal) * 100) : 0

    const monthTasks = tasks.filter(t => t.startDate >= monthStart && t.startDate <= monthEnd)
    const monthCompleted = monthTasks.filter(t => t.completed).length
    const monthTotal = monthTasks.length
    const monthRate = monthTotal > 0 ? Math.round((monthCompleted / monthTotal) * 100) : 0

    let streak = 0
    const date = new Date(currentYear, todayMonth - 1, todayDay)
    const completedDates = new Set(
      tasks.filter(t => t.completed).map(t => t.endDate)
    )
    while (completedDates.has(date.toISOString().split('T')[0])) {
      streak++
      date.setDate(date.getDate() - 1)
    }

    const overdue = tasks.filter(t => !t.completed && t.endDate < today).length

    return {
      todayCompleted,
      todayTotal,
      weekRate,
      monthRate,
      streak,
      overdue,
      isCurrentYear
    }
  }, [tasks, currentYear])

  if (categories.length === 0) return null

  return (
    <div className="px-4 py-2 glass border-b border-white/20 dark:border-slate-700/50">
      <div className="flex items-center gap-3 overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">오늘</div>
            <div className="text-sm font-bold text-slate-800 dark:text-white">
              {stats.todayCompleted}/{stats.todayTotal}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">이번 주</div>
            <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
              {stats.weekRate}%
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 rounded-xl px-3 py-1.5 flex-shrink-0">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400">이번 달</div>
            <div className="text-sm font-bold text-violet-600 dark:text-violet-400">
              {stats.monthRate}%
            </div>
          </div>
        </div>

        {stats.streak > 0 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-xl px-3 py-1.5 flex-shrink-0 border border-amber-200/50 dark:border-amber-700/50">
            <span className="text-lg">🔥</span>
            <div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400">연속</div>
              <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                {stats.streak}일
              </div>
            </div>
          </div>
        )}

        {stats.overdue > 0 && (
          <div className="flex items-center gap-2 bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 rounded-xl px-3 py-1.5 flex-shrink-0 border border-red-200/50 dark:border-red-700/50">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <div className="text-[10px] text-red-600 dark:text-red-400">기한초과</div>
              <div className="text-sm font-bold text-red-600 dark:text-red-400">
                {stats.overdue}개
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
