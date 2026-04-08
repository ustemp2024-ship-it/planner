import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'

interface StatsPanelProps {
  isOpen: boolean
  onClose: () => void
}

type ViewMode = 'overview' | 'category' | 'monthly' | 'yearly'

export function StatsPanel({ isOpen, onClose }: StatsPanelProps) {
  const { categories, tasks, currentYear } = useStore()
  const [viewMode, setViewMode] = useState<ViewMode>('overview')

  const stats = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    const yearStart = `${currentYear}-01-01`
    const yearEnd = `${currentYear}-12-31`

    const yearTasks = tasks.filter(t => t.startDate >= yearStart && t.startDate <= yearEnd)
    const totalTasks = yearTasks.length
    const completedTasks = yearTasks.filter(t => t.completed).length
    const overallRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

    const overdueTasks = yearTasks.filter(t => !t.completed && t.endDate < today).length
    const upcomingTasks = yearTasks.filter(t => !t.completed && t.startDate <= today && t.endDate >= today).length
    const futureTasks = yearTasks.filter(t => !t.completed && t.startDate > today).length

    const categoryStats = categories.map(cat => {
      const catTasks = yearTasks.filter(t => t.categoryId === cat.id)
      const catCompleted = catTasks.filter(t => t.completed).length
      const catOverdue = catTasks.filter(t => !t.completed && t.endDate < today).length
      const rate = catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0
      return {
        ...cat,
        total: catTasks.length,
        completed: catCompleted,
        overdue: catOverdue,
        rate
      }
    }).sort((a, b) => b.rate - a.rate)

    const monthlyStats = Array.from({ length: 12 }, (_, i) => {
      const month = String(i + 1).padStart(2, '0')
      const monthStart = `${currentYear}-${month}-01`
      const monthEnd = `${currentYear}-${month}-31`
      const monthTasks = yearTasks.filter(t => t.startDate >= monthStart && t.startDate <= monthEnd)
      const monthCompleted = monthTasks.filter(t => t.completed).length
      return {
        month: i + 1,
        monthName: `${i + 1}월`,
        total: monthTasks.length,
        completed: monthCompleted,
        rate: monthTasks.length > 0 ? Math.round((monthCompleted / monthTasks.length) * 100) : 0
      }
    })

    const years = [...new Set(tasks.map(t => t.startDate.substring(0, 4)))].sort()
    const yearlyStats = years.map(year => {
      const yTasks = tasks.filter(t => t.startDate.startsWith(year))
      const yCompleted = yTasks.filter(t => t.completed).length
      return {
        year,
        total: yTasks.length,
        completed: yCompleted,
        rate: yTasks.length > 0 ? Math.round((yCompleted / yTasks.length) * 100) : 0
      }
    })

    const streak = calculateStreak(tasks, today)
    const bestCategory = categoryStats.find(c => c.rate === Math.max(...categoryStats.map(x => x.rate)))
    const worstCategory = categoryStats.filter(c => c.total > 0).find(c => c.rate === Math.min(...categoryStats.filter(x => x.total > 0).map(x => x.rate)))

    return {
      totalTasks,
      completedTasks,
      overallRate,
      overdueTasks,
      upcomingTasks,
      futureTasks,
      categoryStats,
      monthlyStats,
      yearlyStats,
      streak,
      bestCategory,
      worstCategory
    }
  }, [categories, tasks, currentYear])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50 animate-fade-in">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-800 dark:text-white">{currentYear}년 통계</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">달성률 및 상세 분석</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-slate-100 dark:border-slate-800 overflow-x-auto">
          {[
            { id: 'overview', label: '개요', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z' },
            { id: 'category', label: '카테고리', icon: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z' },
            { id: 'monthly', label: '월별', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
            { id: 'yearly', label: '연간', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setViewMode(tab.id as ViewMode)}
              className={`flex-1 min-w-[80px] px-4 py-3 text-sm font-medium transition-all flex items-center justify-center gap-1.5
                ${viewMode === tab.id 
                  ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/20' 
                  : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
              </svg>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(90vh-180px)]">
          {viewMode === 'overview' && (
            <div className="space-y-5 animate-fade-in">
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 p-5 text-white">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
                <div className="relative">
                  <div className="text-blue-100 text-sm mb-1">전체 달성률</div>
                  <div className="text-5xl font-bold mb-2">{stats.overallRate}%</div>
                  <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-1000" 
                      style={{ width: `${stats.overallRate}%` }} 
                    />
                  </div>
                  <div className="mt-2 text-sm text-blue-100">
                    {stats.completedTasks} / {stats.totalTasks} 완료
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 rounded-2xl p-4 border border-emerald-100 dark:border-emerald-800/50">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-400">{stats.completedTasks}</div>
                  <div className="text-xs text-emerald-600/70 dark:text-emerald-500">완료</div>
                </div>
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30 rounded-2xl p-4 border border-amber-100 dark:border-amber-800/50">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.upcomingTasks}</div>
                  <div className="text-xs text-amber-600/70 dark:text-amber-500">진행중</div>
                </div>
                <div className="bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30 rounded-2xl p-4 border border-red-100 dark:border-red-800/50">
                  <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center mb-2">
                    <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.overdueTasks}</div>
                  <div className="text-xs text-red-600/70 dark:text-red-500">기한초과</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🔥</span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">연속 달성</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.streak}일</div>
                </div>
                <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">📅</span>
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-400">예정된 할일</span>
                  </div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">{stats.futureTasks}개</div>
                </div>
              </div>

              {stats.bestCategory && (
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 rounded-2xl p-4 border border-yellow-200/50 dark:border-yellow-800/50">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏆</span>
                    <span className="text-sm font-medium text-amber-700 dark:text-amber-400">최고 달성 카테고리</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stats.bestCategory.color }} />
                      <span className="font-semibold text-slate-800 dark:text-white">{stats.bestCategory.name}</span>
                    </div>
                    <span className="text-lg font-bold" style={{ color: stats.bestCategory.color }}>{stats.bestCategory.rate}%</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {viewMode === 'category' && (
            <div className="space-y-3 animate-fade-in">
              {stats.categoryStats.length === 0 ? (
                <div className="text-center py-8 text-slate-400">카테고리가 없습니다</div>
              ) : (
                stats.categoryStats.map((cat, index) => (
                  <div 
                    key={cat.id} 
                    className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50 shadow-sm animate-slide-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shadow-lg"
                          style={{ backgroundColor: cat.color }}
                        >
                          {cat.rate}%
                        </div>
                        <div>
                          <div className="font-semibold text-slate-800 dark:text-white">{cat.name}</div>
                          <div className="text-xs text-slate-500">{cat.completed} / {cat.total} 완료</div>
                        </div>
                      </div>
                      {cat.overdue > 0 && (
                        <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-full">
                          {cat.overdue} 기한초과
                        </span>
                      )}
                    </div>
                    <div className="h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                          width: `${cat.rate}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {viewMode === 'monthly' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-end gap-1.5 h-40">
                  {stats.monthlyStats.map((m, index) => {
                    const maxTotal = Math.max(...stats.monthlyStats.map(x => x.total), 1)
                    const barHeight = (m.total / maxTotal) * 100
                    const completedHeight = m.total > 0 ? (m.completed / m.total) * barHeight : 0
                    
                    return (
                      <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                        <div className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {m.total > 0 ? `${m.rate}%` : '-'}
                        </div>
                        <div 
                          className="w-full relative rounded-t-lg overflow-hidden bg-slate-200 dark:bg-slate-700 transition-all duration-500"
                          style={{ height: `${Math.max(barHeight, 4)}px`, animationDelay: `${index * 50}ms` }}
                        >
                          <div 
                            className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-blue-600 to-blue-400 transition-all duration-700"
                            style={{ height: `${completedHeight}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">{m.month}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
              
              <div className="space-y-2">
                {stats.monthlyStats.filter(m => m.total > 0).map(m => (
                  <div key={m.month} className="flex items-center justify-between py-2 px-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700/50">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{m.monthName}</span>
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-slate-500">{m.completed}/{m.total}</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">{m.rate}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {viewMode === 'yearly' && (
            <div className="space-y-4 animate-fade-in">
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                <div className="flex items-end gap-3 h-48 px-2">
                  {stats.yearlyStats.map((y, index) => {
                    const maxTotal = Math.max(...stats.yearlyStats.map(x => x.total), 1)
                    const barHeight = (y.total / maxTotal) * 100
                    const completedHeight = y.total > 0 ? (y.completed / y.total) * barHeight : 0
                    const isCurrentYear = y.year === String(currentYear)
                    
                    return (
                      <div key={y.year} className="flex-1 flex flex-col items-center gap-2">
                        <div className={`text-xs font-bold ${isCurrentYear ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500'}`}>
                          {y.rate}%
                        </div>
                        <div 
                          className={`w-full relative rounded-t-xl overflow-hidden transition-all duration-500
                            ${isCurrentYear ? 'bg-blue-200 dark:bg-blue-900/50' : 'bg-slate-200 dark:bg-slate-700'}`}
                          style={{ height: `${Math.max(barHeight, 8)}px`, animationDelay: `${index * 100}ms` }}
                        >
                          <div 
                            className={`absolute bottom-0 left-0 right-0 transition-all duration-700
                              ${isCurrentYear ? 'bg-gradient-to-t from-blue-600 to-blue-400' : 'bg-gradient-to-t from-slate-500 to-slate-400'}`}
                            style={{ height: `${completedHeight}%` }}
                          />
                        </div>
                        <div className="text-center">
                          <div className={`text-xs font-semibold ${isCurrentYear ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'}`}>
                            {y.year}
                          </div>
                          <div className="text-[10px] text-slate-400">{y.total}개</div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">전체 기간 할일</div>
                  <div className="text-2xl font-bold text-slate-800 dark:text-white">
                    {stats.yearlyStats.reduce((sum, y) => sum + y.total, 0)}개
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 border border-slate-100 dark:border-slate-700/50">
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">전체 기간 완료</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {stats.yearlyStats.reduce((sum, y) => sum + y.completed, 0)}개
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function calculateStreak(tasks: { completed: boolean; endDate: string }[], today: string): number {
  const completedDates = new Set(
    tasks
      .filter(t => t.completed)
      .map(t => t.endDate)
  )
  
  let streak = 0
  const date = new Date(today)
  
  while (true) {
    const dateStr = date.toISOString().split('T')[0]
    if (completedDates.has(dateStr)) {
      streak++
      date.setDate(date.getDate() - 1)
    } else {
      break
    }
  }
  
  return streak
}
