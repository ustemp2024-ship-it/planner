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

  const cellTasks = tasks.filter((t) => {
    const start = new Date(t.startDate)
    const end = new Date(t.endDate)
    const current = new Date(date)
    return current >= start && current <= end
  })

  const handleClick = () => {
    if (cellTasks.length === 0) {
      onAddTask(category.id, date)
    }
  }

  return (
    <div
      className="min-h-[24px] h-6 border-r border-b border-slate-200/50 dark:border-slate-700/50 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex items-center justify-center"
      onClick={handleClick}
    >
      {cellTasks.map((task) => {
        const isStart = task.startDate === date

        return (
          <div
            key={task.id}
            onClick={(e) => {
              e.stopPropagation()
              if (isStart) {
                onEditTask(task)
              } else {
                toggleTaskComplete(task.id)
              }
            }}
            className={`
              w-full h-full flex items-center justify-center cursor-pointer transition-all relative group
              ${task.completed ? 'shadow-inner' : 'hover:brightness-95'}
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
            {!task.completed && (
              <div className="w-2 h-2 rounded-full bg-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </div>
        )
      })}
    </div>
  )
}
