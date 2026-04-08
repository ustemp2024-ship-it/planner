import { useState, useRef, memo, useMemo } from 'react'
import type { Task, Category } from '../types'
import { useStore } from '../store/useStore'
import { formatDateRange } from '../utils/dateUtils'

interface TaskCellProps {
  date: string
  category: Category
  tasks: Task[]
  onAddTask: (categoryId: string, date: string) => void
  onEditTask: (task: Task) => void
  selectionMode?: boolean
  selectedTasks?: Set<string>
  onToggleSelection?: (taskId: string) => void
  draggedTaskId?: string | null
  onDragStart?: (taskId: string | null) => void
  onDragEnd?: () => void
  onDropTask?: (taskId: string, newDate: string, newCategoryId: string) => void
}

export const TaskCell = memo(function TaskCell({ date, category, tasks, onAddTask, onEditTask, selectionMode = false, selectedTasks = new Set(), onToggleSelection, draggedTaskId, onDragStart, onDragEnd, onDropTask }: TaskCellProps) {
  const { toggleTaskComplete } = useStore()
  const [isDragOver, setIsDragOver] = useState(false)
  const [hoveredTaskId, setHoveredTaskId] = useState<string | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [isLongPress, setIsLongPress] = useState(false)

  const cellTasks = useMemo(() => tasks.filter((t) => {
    return t.startDate <= date && t.endDate >= date
  }), [tasks, date])

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

  const cellHeight = taskCount > 1 ? `${taskCount * 20}px` : '24px'

  return (
    <div
      className={`min-h-[24px] border-r border-b border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex flex-col items-stretch justify-center relative ${isDragOver ? 'bg-blue-100 dark:bg-blue-900/50 ring-2 ring-blue-400 ring-inset' : ''}`}
      style={{ height: cellHeight }}
      onClick={handleClick}
      onDragOver={(e) => {
        e.preventDefault()
        if (draggedTaskId) setIsDragOver(true)
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setIsDragOver(false)
        if (draggedTaskId && onDropTask) {
          onDropTask(draggedTaskId, date, category.id)
        }
      }}
    >
      {cellTasks.map((task) => {
        const isStart = task.startDate === date
        const isEnd = task.endDate === date
        const isSingleDay = task.startDate === task.endDate
        const showTooltip = hoveredTaskId === task.id

        return (
          <div
            key={task.id}
            draggable={!selectionMode}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = 'copy'
              onDragStart?.(task.id)
            }}
            onDragEnd={() => onDragEnd?.()}
            onClick={(e) => {
              e.stopPropagation()
              if (selectionMode && onToggleSelection) {
                onToggleSelection(task.id)
                return
              }
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
              flex items-center justify-start cursor-pointer transition-all relative group px-0.5 overflow-hidden
              ${task.completed ? 'shadow-inner' : 'hover:brightness-95'}
              ${isStart && !isSingleDay ? 'rounded-l-sm' : ''}
              ${isEnd && !isSingleDay ? 'rounded-r-sm' : ''}
              ${taskCount > 1 ? 'h-5 w-full' : 'h-full w-full'}
              ${selectionMode && selectedTasks.has(task.id) ? 'ring-2 ring-red-500 ring-inset' : ''}
            `}
            style={{
              backgroundColor: task.completed 
                ? category.color 
                : `${category.color}50`,
            }}
          >
            {selectionMode && selectedTasks.has(task.id) && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-500/30 z-20">
                <svg className="w-3.5 h-3.5 text-red-600 drop-shadow-sm" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {!selectionMode && task.completed && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 bg-black/10" />
                <svg className="w-3.5 h-3.5 text-white drop-shadow-sm relative z-10" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
            {!task.completed && isStart && (
              <span 
                className="text-[7px] font-bold text-white/90 truncate drop-shadow-sm leading-tight"
                style={{ textShadow: '0 1px 2px rgba(0,0,0,0.3)' }}
              >
                {task.title.length > 6 ? task.title.substring(0, 6) : task.title}
              </span>
            )}
            {!task.completed && !isStart && (
              <div className="w-1.5 h-1.5 rounded-full bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}

            {showTooltip && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 z-50 pointer-events-none">
                <div className="bg-slate-900 dark:bg-slate-700 text-white text-xs px-2 py-1.5 rounded-lg shadow-xl whitespace-nowrap max-w-[200px]">
                  <div className="font-semibold truncate">{task.title}</div>
                  {task.description && (
                    <div className="text-slate-300 text-[10px] truncate">{task.description}</div>
                  )}
                  <div className="text-slate-400 text-[10px] mt-0.5">
                    {formatDateRange(task.startDate, task.endDate)}
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
})
