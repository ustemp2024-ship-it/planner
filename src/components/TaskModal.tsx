import { useState, useEffect } from 'react'
import type { Task } from '../types'
import { useStore } from '../store/useStore'

interface TaskModalProps {
  isOpen: boolean
  onClose: () => void
  task?: Task | null
  categoryId?: string
  initialDate?: string
}

export function TaskModal({ isOpen, onClose, task, categoryId, initialDate }: TaskModalProps) {
  const { addTask, updateTask, deleteTask } = useStore()
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setStartDate(task.startDate)
      setEndDate(task.endDate)
    } else if (initialDate) {
      setTitle('')
      setStartDate(initialDate)
      setEndDate(initialDate)
    }
  }, [task, initialDate])

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return

    if (task) {
      updateTask(task.id, { title, startDate, endDate })
    } else if (categoryId) {
      addTask({
        categoryId,
        title,
        startDate,
        endDate,
        completed: false,
      })
    }
    onClose()
  }

  const handleDelete = () => {
    if (task) {
      deleteTask(task.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-4 shadow-xl">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">
          {task ? '할 일 수정' : '새 할 일'}
        </h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="할 일 입력"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg mb-3 bg-white dark:bg-gray-700 dark:text-white"
            autoFocus
          />
          <div className="flex gap-2 mb-3">
            <div className="flex-1">
              <label className="text-sm text-gray-600 dark:text-gray-400">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm text-gray-600 dark:text-gray-400">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {task && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg dark:text-white"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
