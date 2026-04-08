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
      className="min-h-[40px] border-r border-b border-gray-200 dark:border-gray-700 p-1 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
      onClick={handleClick}
    >
      {cellTasks.map((task) => {
        const isStart = task.startDate === date
        const isEnd = task.endDate === date
        const isSingle = isStart && isEnd

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
              text-xs p-1 mb-1 truncate cursor-pointer transition-all
              ${isSingle ? 'rounded' : isStart ? 'rounded-l' : isEnd ? 'rounded-r' : ''}
              ${task.completed ? 'opacity-60 line-through' : ''}
            `}
            style={{
              backgroundColor: task.completed 
                ? category.color 
                : `${category.color}66`,
              color: task.completed ? '#fff' : '#000',
            }}
          >
            {isStart ? task.title : ''}
          </div>
        )
      })}
    </div>
  )
}
