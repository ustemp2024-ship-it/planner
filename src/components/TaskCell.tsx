import { useState, useRef } from 'react'
import type { Task, Category } from '../types'
import { useStore } from '../store/useStore'

interface TaskCellProps {
  date: string
  category: Category
  tasks: Task[]
  onAddTask: (categoryId: string, date: string) => void
  onEditTask: (task: Task) => void
}

export function TaskCell({ date, category, tasks, onAddTask, onEditTask }: TaskCellProps) {
  const { toggleTaskComplete } = useStore()
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLongPress, setIsLongPress] = useState(false)

  const cellTasks = tasks.filter((t) => {
    const start = new Date(t.startDate)
    const end = new Date(t.endDate)
    const current = new Date(date)
    return current >= start && current <= end
  })

  const handleClick = () => {
    if (isLongPress) {
      setIsLongPress(false)
      return
    }
    if (cellTasks.length === 0) {
      onAddTask(category.id, date)
    }
  }

  const handleTouchStart = (task: Task) => {
    longPressTimer.current = setTimeout(() => {
      setIsLongPress(true)
      toggleTaskComplete(task.id)
    }, 500)
  }

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }

  const taskCount = cellTasks.length

  return (
    <div
      className="min-h-[24px] h-6 border-r border-b border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center relative"
      onClick={handleClick}
    >
      {cellTasks.map((task, index) => {
        const isStart = task.startDate === date
        const isEnd = task.endDate === date
        const isSingleDay = task.startDate === task.endDate
        const showTooltip = hoveredTaskId === task.id

        return (
          <div
            key={task.id}
            onClick={(e) => {
              e.stopPropagation()
              if (isLongPress) {
                setIsLongPress(false)
                return
              }
              if (isStart) {
                onEditTask(task)
              } else {
                toggleTaskComplete(task.id)
              }
            }}
            onTouchStart={() => handleTouchStart(task)}
            onTouchEnd={handleTouchEnd}
            onTouchCancel={handleTouchEnd}
            onMouseEnter={() => setHoveredTaskId(task.id)}
            onMouseLeave={() => setHoveredTaskId(null)}
            className={`
              h-full flex items-center justify-center cursor-pointer transition-all relative group
              ${task.completed ? 'shadow-inner' : 'hover:brightness-95'}
              ${isStart && !isSingleDay ? 'rounded-l-sm' : ''}
              ${isEnd && !isSingleDay ? 'rounded-r-sm' : ''}
              ${taskCount > 1 ? 'flex-1' : 'w-full'}
            `}
            style={{
              backgroundColor: task.completed 
                ? category.color 
                : `${category.color}50`,
            }}
          >
            {task.completed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/10" />
                <svg className="w-3.5 h-3.5 text-white drop-shadow-sm relative z-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {!task.completed && isStart && taskCount === 1 && (
              <span 
                className="text-[8px] font-bold text-white/90 truncate px-0.5 drop-shadow-sm"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
              >
                {task.title.charAt(0)}
              </span>
            )}
            {!task.completed && taskCount > 1 && (
              <span 
                className="text-[7px] font-bold text-white/90 drop-shadow-sm"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
              >
                {index + 1}
              </span>
            )}
            {!task.completed && !isStart && taskCount === 1 && (
              <div className="w-2 h-2 rounded-full bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 pointer-events-none">
                <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs px-2 py-1.5 rounded-lg shadow-xl whitespace-nowrap max-w-[200px]">
                  <div className="font-semibold truncate">{task.title}</div>
                  {task.description && (
                    <div className="text-slate-300 text-[10px] truncate">{task.description}</div>
                  )}
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {task.startDate === task.endDate 
                      ? task.startDate 
                      : `${task.startDate} ~ ${task.endDate}`}
                  </div>
                  {task.completed && (
                    <div className="text-emerald-400 text-[10px] font-medium">완료됨</div>
                  )}
                </div>
                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-900 dark:border-t-slate-700" />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
