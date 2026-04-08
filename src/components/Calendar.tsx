import { useMemo, useState, useRef } from 'react'
import { useStore } from '../store/useStore'
import { TaskCell } from './TaskCell'
import { TaskModal } from './TaskModal'
import type { Task } from '../types'

export function Calendar() {
  const { categories, tasks, currentMonth, nextMonth, prevMonth } = useStore()
  const [taskModal, setTaskModal] = useState<{
    isOpen: boolean
    task?: Task | null
    categoryId?: string
    date?: string
  }>({ isOpen: false })
  
  const scrollRef = useRef<HTMLDivElement>(null)
  const touchStartX = useRef(0)

  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()
    const days = new Date(year, month + 1, 0).getDate()
    return Array.from({ length: days }, (_, i) => {
      const date = new Date(year, month, i + 1)
      return {
        date: date.toISOString().split('T')[0],
        day: i + 1,
        dayOfWeek: date.getDay(),
      }
    })
  }, [currentMonth])

  const monthLabel = useMemo(() => {
    return currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })
  }, [currentMonth])

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) {
      if (diff > 0) nextMonth()
      else prevMonth()
    }
  }

  const sortedCategories = [...categories].sort((a, b) => a.order - b.order)

  return (
    <div 
      className="flex-1 overflow-hidden flex flex-col"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={prevMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold dark:text-white">{monthLabel}</h2>
        <button
          onClick={nextMonth}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto" ref={scrollRef}>
        <div className="min-w-max">
          <div className="flex sticky top-0 z-10 bg-white dark:bg-gray-800">
            <div className="w-24 flex-shrink-0 p-2 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
              <span className="text-sm font-medium dark:text-white">카테고리</span>
            </div>
            {daysInMonth.map(({ day, dayOfWeek, date }) => {
              const isToday = date === new Date().toISOString().split('T')[0]
              const isSunday = dayOfWeek === 0
              const isSaturday = dayOfWeek === 6
              return (
                <div
                  key={date}
                  className={`w-16 flex-shrink-0 p-2 text-center border-r border-b border-gray-200 dark:border-gray-700 
                    ${isToday ? 'bg-blue-100 dark:bg-blue-900' : 'bg-gray-50 dark:bg-gray-800'}
                  `}
                >
                  <div className={`text-sm font-medium ${isSunday ? 'text-red-500' : isSaturday ? 'text-blue-500' : 'dark:text-white'}`}>
                    {day}
                  </div>
                  <div className={`text-xs ${isSunday ? 'text-red-400' : isSaturday ? 'text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {['일', '월', '화', '수', '목', '금', '토'][dayOfWeek]}
                  </div>
                </div>
              )
            })}
          </div>

          {sortedCategories.map((category) => (
            <div key={category.id} className="flex">
              <div 
                className="w-24 flex-shrink-0 p-2 border-r border-b border-gray-200 dark:border-gray-700 flex items-center"
                style={{ backgroundColor: `${category.color}33` }}
              >
                <div 
                  className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                  style={{ backgroundColor: category.color }}
                />
                <span className="text-sm truncate dark:text-white">{category.name}</span>
              </div>
              {daysInMonth.map(({ date }) => (
                <div key={date} className="w-16 flex-shrink-0">
                  <TaskCell
                    date={date}
                    category={category}
                    tasks={tasks.filter((t) => t.categoryId === category.id)}
                    onAddTask={(categoryId, d) => setTaskModal({ isOpen: true, categoryId, date: d })}
                    onEditTask={(task) => setTaskModal({ isOpen: true, task })}
                  />
                </div>
              ))}
            </div>
          ))}

          {sortedCategories.length === 0 && (
            <div className="p-8 text-center text-gray-500 dark:text-gray-400">
              카테고리를 추가해주세요
            </div>
          )}
        </div>
      </div>

      <TaskModal
        isOpen={taskModal.isOpen}
        onClose={() => setTaskModal({ isOpen: false })}
        task={taskModal.task}
        categoryId={taskModal.categoryId}
        initialDate={taskModal.date}
      />
    </div>
  )
}
