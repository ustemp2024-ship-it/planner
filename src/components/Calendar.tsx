import { useMemo, useState, useRef, useEffect } from 'react'
import { useStore } from '../store/useStore'
import { TaskCell } from './TaskCell'
import { TaskModal } from './TaskModal'
import type { Task } from '../types'
import { getDayOfWeek, isRedDay } from '../utils/holidays'

const MONTHS = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

interface CalendarProps {
  selectionMode?: boolean
  selectedTasks?: Set<string>
  onToggleSelection?: (taskId: string) => void
  draggedTaskId?: string | null
  onDragStart?: (taskId: string | null) => void
  onDragEnd?: () => void
}

export function Calendar({ selectionMode = false, selectedTasks = new Set(), onToggleSelection, draggedTaskId, onDragStart, onDragEnd }: CalendarProps) {
  const { categories, tasks, currentYear, nextYear, prevYear, hiddenCategories, copyTask } = useStore()
  const [taskModal, setTaskModal] = useState<{
    isOpen: boolean
    task?: Task | null
    categoryId?: string
    date?: string
  }>({ isOpen: false })
  const [showDatePicker, setShowDatePicker] = useState(false)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const monthRefs = useRef<{ [key: number]: HTMLDivElement | null }>({})

  const sortedCategories = useMemo(() => 
    [...categories]
      .filter(c => !hiddenCategories.includes(c.id))
      .sort((a, b) => a.order - b.order),
    [categories, hiddenCategories]
  )

  const getCategoriesForMonth = useMemo(() => {
    const monthCategories: Record<number, string[]> = {}
    for (let month = 0; month < 12; month++) {
      const monthStr = String(month + 1).padStart(2, '0')
      const prefix = `${currentYear}-${monthStr}-`
      const categoryIds = new Set<string>()
      tasks.forEach(t => {
        if (t.startDate.startsWith(prefix) || t.endDate.startsWith(prefix) ||
            (t.startDate < prefix && t.endDate >= prefix)) {
          categoryIds.add(t.categoryId)
        }
      })
      monthCategories[month] = Array.from(categoryIds)
    }
    return monthCategories
  }, [tasks, currentYear])

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
  const todayMonth = new Date().getMonth()
  const todayDay = new Date().getDate()

  const scrollToMonth = (monthIndex: number) => {
    const monthElement = monthRefs.current[monthIndex]
    if (monthElement && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const elementTop = monthElement.offsetTop
      const headerHeight = 60 // 헤더 높이 고려
      container.scrollTo({
        top: elementTop - headerHeight,
        behavior: 'smooth'
      })
    }
  }

  const handleDateSearch = (month: number) => {
    if (month >= 1 && month <= 12) {
      const monthIndex = month - 1
      scrollToMonth(monthIndex)
      setShowDatePicker(false)
    }
  }

  const goToToday = () => {
    if (currentYear === new Date().getFullYear()) {
      scrollToMonth(todayMonth)
    }
  }

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showDatePicker) {
        const target = event.target as HTMLElement
        if (!target.closest('[data-date-picker]')) {
          setShowDatePicker(false)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showDatePicker])

  return (
    <div className="flex-1 overflow-hidden flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 glass border-b border-white/20 dark:border-slate-700/50">
        <button
          onClick={prevYear}
          className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
        >
          <svg className="w-5 h-5 text-slate-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">{currentYear}년</h2>
          {currentYear === new Date().getFullYear() && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-full">
              올해
            </span>
          )}
          
          {/* 날짜 탐색 버튼들 */}
          <div className="flex items-center gap-2 ml-4">
            {currentYear === new Date().getFullYear() && (
              <button
                onClick={goToToday}
                className="px-3 py-1.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900 transition-colors"
              >
                오늘
              </button>
            )}
            <button
              onClick={() => setShowDatePicker(!showDatePicker)}
              className="p-2 rounded-lg bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="월 탐색"
              data-date-picker
            >
              <svg className="w-4 h-4 text-slate-600 dark:text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </div>
        </div>
        <button
          onClick={nextYear}
          className="p-2.5 rounded-xl bg-white/60 dark:bg-slate-800/60 hover:bg-white dark:hover:bg-slate-700 transition-all shadow-sm active:scale-95"
        >
          <svg className="w-5 h-5 text-slate-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* 월 선택 드롭다운 */}
      {showDatePicker && (
        <div className="absolute top-16 left-1/2 transform -translate-x-1/2 z-20 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 min-w-64" data-date-picker>
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">월 선택</h3>
          <div className="grid grid-cols-3 gap-2">
            {MONTHS.map((monthName, index) => (
              <button
                key={index}
                onClick={() => handleDateSearch(index + 1)}
                className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                  index === todayMonth && currentYear === new Date().getFullYear()
                    ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 font-medium'
                    : 'bg-slate-50 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-600'
                }`}
              >
                {monthName}
              </button>
            ))}
          </div>
          <button
            onClick={() => setShowDatePicker(false)}
            className="w-full mt-3 px-3 py-2 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
          >
            닫기
          </button>
        </div>
      )}

      <div className="flex-1 overflow-auto" ref={scrollContainerRef}>
        <div className="min-w-max">
          <div className="flex sticky top-0 z-10 glass">
            <div className="w-24 flex-shrink-0 px-2 py-2 border-r border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-100/80 dark:bg-slate-900/80">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">월 / 일</span>
            </div>
            {DAYS.map((day) => (
              <div
                key={day}
                className={`w-10 flex-shrink-0 py-2 text-center border-r border-b border-slate-200/50 dark:border-slate-700/50 
                  ${day === todayDay && currentYear === new Date().getFullYear() ? 'bg-blue-100/80 dark:bg-blue-900/30' : 'bg-slate-50/80 dark:bg-slate-800/80'}`}
              >
                <span className={`text-xs font-semibold ${day === todayDay && currentYear === new Date().getFullYear() ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-300'}`}>
                  {day}
                </span>
              </div>
            ))}
          </div>

          {MONTHS.map((monthName, monthIndex) => (
            <div 
              key={monthIndex} 
              className="animate-fade-in" 
              style={{ animationDelay: `${monthIndex * 20}ms` }}
              ref={(el) => { monthRefs.current[monthIndex] = el }}
            >
              <div className="flex sticky left-0">
                <div className={`w-24 flex-shrink-0 px-2 py-1.5 border-r border-b border-slate-200/50 dark:border-slate-700/50 
                  ${monthIndex === todayMonth && currentYear === new Date().getFullYear() 
                    ? 'bg-gradient-to-r from-blue-100 to-blue-50 dark:from-blue-900/40 dark:to-slate-900/40' 
                    : 'bg-slate-100/60 dark:bg-slate-900/60'}`}>
                  <span className={`text-sm font-bold ${monthIndex === todayMonth && currentYear === new Date().getFullYear() ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-white'}`}>
                    {monthName}
                  </span>
                </div>
                {DAYS.map((day) => {
                  const isValid = isValidDay(monthIndex, day)
                  const dateStr = getDateString(monthIndex, day)
                  const isToday = dateStr === todayString
                  const dayOfWeek = isValid ? getDayOfWeek(currentYear, monthIndex, day) : ''
                  const isRed = isValid && isRedDay(currentYear, monthIndex, day)
                  return (
                    <div
                      key={day}
                      onClick={() => isValid && setTaskModal({ isOpen: true, date: dateStr })}
                      className={`w-10 flex-shrink-0 h-7 border-r border-b border-slate-200/50 dark:border-slate-700/50 cursor-pointer transition-all flex items-center justify-center
                        ${!isValid ? 'bg-slate-200/60 dark:bg-slate-800/60 cursor-default' : 'hover:bg-slate-100 dark:hover:bg-slate-800'}
                        ${isToday ? 'bg-blue-200/60 dark:bg-blue-800/40 ring-1 ring-blue-400 ring-inset' : ''}
                      `}
                    >
                      {isValid && (
                        <span className={`text-[10px] font-medium ${isRed ? 'text-red-500' : 'text-slate-400 dark:text-slate-500'}`}>
                          {dayOfWeek}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>

              {sortedCategories
                .filter(c => getCategoriesForMonth[monthIndex]?.includes(c.id))
                .map((category) => (
                <div key={`${monthIndex}-${category.id}`} className="flex">
                  <div
                    className="w-24 flex-shrink-0 px-2 py-0.5 border-r border-b border-slate-200/50 dark:border-slate-700/50 flex items-center gap-1.5 transition-colors"
                    style={{ backgroundColor: `${category.color}15` }}
                  >
                    <div
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: category.color }}
                    />
                    <span className="text-xs font-medium truncate text-slate-700 dark:text-slate-200">{category.name}</span>
                  </div>
                  {DAYS.map((day) => {
                    const isValid = isValidDay(monthIndex, day)
                    if (!isValid) {
                      return (
                        <div
                          key={day}
                          className="w-10 flex-shrink-0 border-r border-b border-slate-200/50 dark:border-slate-700/50 bg-slate-200/60 dark:bg-slate-800/60"
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
                          selectionMode={selectionMode}
                          selectedTasks={selectedTasks}
                          onToggleSelection={onToggleSelection}
                          draggedTaskId={draggedTaskId}
                          onDragStart={onDragStart}
                          onDragEnd={onDragEnd}
                          onDropTask={(taskId, newDate, newCategoryId) => {
                            const task = tasks.find(t => t.id === taskId)
                            if (task) {
                              const duration = new Date(task.endDate).getTime() - new Date(task.startDate).getTime()
                              const newEndDate = new Date(new Date(newDate).getTime() + duration).toISOString().split('T')[0]
                              copyTask(taskId, newDate, newEndDate, newCategoryId)
                            }
                          }}
                        />
                      </div>
                    )
                  })}
                </div>
              ))}

              {(!getCategoriesForMonth[monthIndex] || getCategoriesForMonth[monthIndex].length === 0) && (
                <div className="flex">
                  <div className="w-24 flex-shrink-0 p-1 border-r border-b border-slate-200/50 dark:border-slate-700/50 text-xs text-slate-400">
                    -
                  </div>
                  {DAYS.map((day) => (
                    <div
                      key={day}
                      className="w-10 flex-shrink-0 border-r border-b border-slate-200/50 dark:border-slate-700/50"
                    />
                  ))}
                </div>
              )}
            </div>
          ))}

          {sortedCategories.length === 0 && (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <p className="text-slate-500 dark:text-slate-400 font-medium">카테고리를 추가해주세요</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">우측 상단의 태그 버튼을 눌러 시작하세요</p>
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
