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
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reminderDate, setReminderDate] = useState('')

  useEffect(() => {
    if (task) {
      setStep('task')
      setSelectedCategoryId(task.categoryId)
      setTitle(task.title)
      setDescription(task.description || '')
      setStartDate(task.startDate)
      setEndDate(task.endDate)
      setReminderDate(task.reminderDate || '')
    } else if (initialCategoryId) {
      setStep('task')
      setSelectedCategoryId(initialCategoryId)
      setTitle('')
      setDescription('')
      setStartDate(initialDate || '')
      setEndDate(initialDate || '')
      setReminderDate('')
    } else if (initialDate) {
      setStep('category')
      setSelectedCategoryId('')
      setTitle('')
      setDescription('')
      setStartDate(initialDate)
      setEndDate(initialDate)
      setReminderDate('')
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
      updateTask(task.id, { 
        title, 
        description: description || undefined,
        startDate, 
        endDate, 
        categoryId: selectedCategoryId,
        reminderDate: reminderDate || undefined
      })
    } else {
      addTask({
        categoryId: selectedCategoryId,
        title,
        description: description || undefined,
        startDate,
        endDate,
        completed: false,
        reminderDate: reminderDate || undefined
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
    setDescription('')
    setReminderDate('')
    onClose()
  }

  const selectedCategory = categories.find(c => c.id === selectedCategoryId)

  if (step === 'category' && !task) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold mb-5 dark:text-white">카테고리 선택</h2>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-6">
                카테고리를 먼저 추가해주세요
              </p>
            ) : (
              categories
                .sort((a, b) => a.order - b.order)
                .map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 border border-transparent hover:border-gray-200 dark:hover:border-gray-600"
                  >
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="dark:text-white font-medium">{cat.name}</span>
                  </button>
                ))
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-full mt-5 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm p-5 shadow-2xl border border-gray-100 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-5">
          {!task && (
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <svg className="w-5 h-5 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
            {task ? '할 일 수정' : '새 할 일'}
            {selectedCategory && (
              <span
                className="text-sm px-3 py-1 rounded-full font-medium"
                style={{ backgroundColor: `${selectedCategory.color}20`, color: selectedCategory.color }}
              >
                {selectedCategory.name}
              </span>
            )}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일 제목"
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              autoFocus
            />
          </div>
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 메모 (선택사항)"
              rows={3}
              className="w-full px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">알림 날짜 (선택)</label>
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            {task && (
              <button
                type="button"
                onClick={handleDelete}
                className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-medium hover:bg-red-600 transition-colors"
              >
                삭제
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium hover:bg-blue-600 transition-colors shadow-lg shadow-blue-500/25"
            >
              저장
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
