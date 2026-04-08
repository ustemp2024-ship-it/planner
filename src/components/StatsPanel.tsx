import { useMemo } from 'react'
import { useStore } from '../store/useStore'

interface StatsPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function StatsPanel({ isOpen, onClose }: StatsPanelProps) {
  const { categories, tasks, currentYear } = useStore()

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

    const categoryStats = categories.map(cat => {
      const catTasks = yearTasks.filter(t => t.categoryId === cat.id)
      const catCompleted = catTasks.filter(t => t.completed).length
      const rate = catTasks.length > 0 ? Math.round((catCompleted / catTasks.length) * 100) : 0
      return {
        ...cat,
        total: catTasks.length,
        completed: catCompleted,
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
        total: monthTasks.length,
        completed: monthCompleted,
        rate: monthTasks.length > 0 ? Math.round((monthCompleted / monthTasks.length) * 100) : 0
      }
    })

    return {
      totalTasks,
      completedTasks,
      overallRate,
      overdueTasks,
      upcomingTasks,
      categoryStats,
      monthlyStats
    }
  }, [categories, tasks, currentYear])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[85vh] overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold dark:text-white">{currentYear}년 통계</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-5 overflow-y-auto max-h-[calc(85vh-80px)]">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
              <div className="text-3xl font-bold">{stats.overallRate}%</div>
              <div className="text-blue-100 text-sm">전체 달성률</div>
            </div>
            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
              <div className="text-3xl font-bold">{stats.completedTasks}<span className="text-lg">/{stats.totalTasks}</span></div>
              <div className="text-green-100 text-sm">완료한 할 일</div>
            </div>
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
              <div className="text-3xl font-bold">{stats.upcomingTasks}</div>
              <div className="text-orange-100 text-sm">진행 중</div>
            </div>
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl p-4 text-white">
              <div className="text-3xl font-bold">{stats.overdueTasks}</div>
              <div className="text-red-100 text-sm">기한 초과</div>
            </div>
          </div>

          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">카테고리별 달성률</h3>
            {stats.categoryStats.length === 0 ? (
              <p className="text-gray-400 text-center py-4">카테고리가 없습니다</p>
            ) : (
              <div className="space-y-3">
                {stats.categoryStats.map(cat => (
                  <div key={cat.id} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="font-medium dark:text-white text-sm">{cat.name}</span>
                      </div>
                      <span className="text-sm font-bold" style={{ color: cat.color }}>
                        {cat.rate}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${cat.rate}%`,
                          backgroundColor: cat.color
                        }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {cat.completed} / {cat.total} 완료
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-3">월별 추이</h3>
            <div className="flex items-end gap-1 h-24 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
              {stats.monthlyStats.map(m => (
                <div key={m.month} className="flex-1 flex flex-col items-center">
                  <div 
                    className="w-full bg-blue-500 rounded-t transition-all duration-300"
                    style={{ 
                      height: `${Math.max(m.rate * 0.6, m.total > 0 ? 4 : 0)}px`,
                      opacity: m.total > 0 ? 1 : 0.3
                    }}
                  />
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-1">{m.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
