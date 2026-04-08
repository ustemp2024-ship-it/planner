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

export function TaskModal({ isOpen, onClose, task, categoryId: initialCategoryId, initialDate }: TaskModalProps) {
  const { categories, addTask, updateTask, deleteTask } = useStore()
  const [step, setStep] = useState<'category' | 'task'>('category')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    if (task) {
      setStep('task')
      setSelectedCategoryId(task.categoryId)
      setTitle(task.title)
      setStartDate(task.startDate)
      setEndDate(task.endDate)
    } else if (initialCategoryId) {
      setStep('task')
      setSelectedCategoryId(initialCategoryId)
      setTitle('')
      setStartDate(initialDate || '')
      setEndDate(initialDate || '')
    } else if (initialDate) {
      setStep('category')
      setSelectedCategoryId('')
      setTitle('')
      setStartDate(initialDate)
      setEndDate(initialDate)
    }
  }, [task, initialCategoryId, initialDate, isOpen])

  if (!isOpen) return null

  const handleCategorySelect = (catId: string) => {
    setSelectedCategoryId(catId)
    setStep('task')
  }

  const handleBack = () => {
    setStep('category')
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !selectedCategoryId) return

    if (task) {
      updateTask(task.id, { title, startDate, endDate, categoryId: selectedCategoryId })
    } else {
      addTask({
        categoryId: selectedCategoryId,
        title,
        startDate,
        endDate,
        completed: false,
      })
    }
    handleClose()
  }

  const handleDelete = () => {
    if (task) {
      deleteTask(task.id)
      handleClose()
    }
  }

  const handleClose = () => {
    setStep('category')
    setSelectedCategoryId('')
    setTitle('')
    onClose()
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  if (step === 'category' && !task) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-4 shadow-xl">
          <h2 className="text-lg font-semibold mb-4 dark:text-white">카테고리 선택</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                카테고리를 먼저 추가해주세요
              </p>
            ) : (
              categories
                .sort((a, b) => a.order - b.order)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="dark:text-white">{cat.name}</span>
                  </button>
                ))
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg dark:text-white"
          >
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-4 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          {!task && (
            <button
              onClick={handleBack}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
            >
              <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
            {task ? '할 일 수정' : '새 할 일'}
            {selectedCategory && (
              <span
                className="text-sm px-2 py-1 rounded"
                style={{ backgroundColor: `${selectedCategory.color}33`, color: selectedCategory.color }}
              >
                {selectedCategory.name}
              </span>
            )}
          </h2>
        </div>
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
              onClick={handleClose}
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
