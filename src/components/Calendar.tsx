import { useMemo, useState } from 'react'
import { useStore } from '../store/useStore'
import { TaskCell } from './TaskCell'
import { TaskModal } from './TaskModal'
import type { Task } from '../types'

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

export function Calendar() {
  const { categories, tasks, currentYear, nextYear, prevYear } = useStore()
  const [taskModal, setTaskModal] = useState<{
    isOpen: boolean
    task?: Task | null
    categoryId?: string
    date?: string
  }>({ isOpen: false })

  const sortedCategories = useMemo(() => 
    [...categories].sort((a, b) => a.order - b.order),
    [categories]
  )

  const getDateString = (month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${currentYear}-${m}-${d}`
  }

  const getDaysInMonth = (month: number) => {
    return new Date(currentYear, month + 1, 0).getDate()
  }

  const isValidDay = (month: number, day: number) => {
    return day <= getDaysInMonth(month)
  }

  const todayString = new Date().toISOString().split('T')[0]

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={prevYear}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h2 className="text-lg font-semibold dark:text-white">{currentYear}년</h2>
        <button
          onClick={nextYear}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          <svg className="w-6 h-6 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="min-w-max">
          <div className="flex sticky top-0 z-10 bg-white dark:bg-gray-800">
            <div className="w-20 flex-shrink-0 p-1 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-900">
              <span className="text-xs font-medium dark:text-white">월/일</span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className="w-10 flex-shrink-0 p-1 text-center border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
              >
                <span className="text-xs font-medium dark:text-white">{day}</span>
              </div>
            ))}
          </div>

          {MONTHS.map((monthName, monthIndex) => (
            <div key={monthIndex}>
              <div className="flex bg-gray-100 dark:bg-gray-900 sticky left-0">
                <div className="w-20 flex-shrink-0 p-1 border-r border-b border-gray-200 dark:border-gray-700 font-semibold">
                  <span className="text-xs dark:text-white">{monthName}</span>
                </div>
                {DAYS.map((day) => {
                  const isValid = isValidDay(monthIndex, day)
                  const dateStr = getDateString(monthIndex, day)
                  const isToday = dateStr === todayString
                  return (
                    <div
                      key={day}
                      className={`w-10 flex-shrink-0 border-r border-b border-gray-200 dark:border-gray-700 
                        ${!isValid ? 'bg-gray-200 dark:bg-gray-800' : ''}
                        ${isToday ? 'bg-blue-100 dark:bg-blue-900' : ''}
                      `}
                    />
                  )
                })}
              </div>

              {sortedCategories.map((category) => (
                <div key={`${monthIndex}-${category.id}`} className="flex">
                  <div
                    className="w-20 flex-shrink-0 p-1 border-r border-b border-gray-200 dark:border-gray-700 flex items-center"
                    style={{ backgroundColor: `${category.color}33` }}
                  >
                    <div
                      className="w-2 h-2 rounded-full mr-1 flex-shrink-0"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs truncate dark:text-white">{category.name}</span>
                  </div>
                  {DAYS.map((day) => {
                    const isValid = isValidDay(monthIndex, day)
                    if (!isValid) {
                      return (
                        <div
                          key={day}
                          className="w-10 flex-shrink-0 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-200 dark:bg-gray-800"
                        />
                      )
                    }
                    const dateStr = getDateString(monthIndex, day)
                    return (
                      <div key={day} className="w-10 flex-shrink-0">
                        <TaskCell
                          date={dateStr}
                          category={category}
                          tasks={tasks.filter((t) => t.categoryId === category.id)}
                          onAddTask={(categoryId, d) => setTaskModal({ isOpen: true, categoryId, date: d })}
                          onEditTask={(task) => setTaskModal({ isOpen: true, task })}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}

              {sortedCategories.length === 0 && (
                <div className="flex">
                  <div className="w-20 flex-shrink-0 p-1 border-r border-b border-gray-200 dark:border-gray-700 text-xs text-gray-400">
                    -
                  </div>
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="w-10 flex-shrink-0 border-r border-b border-gray-200 dark:border-gray-700"
                    />
                  ))}
                </div>
              )}
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
