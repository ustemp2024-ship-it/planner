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
  const { categories, addTask, updateTask, deleteTask, toggleTaskComplete, copyTask } = useStore()
  const [step, setStep] = useState<'category' | 'task' | 'copy'>('category')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [reminderDate, setReminderDate] = useState('')
  const [copyStartDate, setCopyStartDate] = useState('')
  const [copyEndDate, setCopyEndDate] = useState('')

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

  const handleToggleComplete = () => {
    if (task) {
      toggleTaskComplete(task.id)
      handleClose()
    }
  }

  const handleCopyTask = () => {
    if (task) {
      setCopyStartDate(task.startDate)
      setCopyEndDate(task.endDate)
      setStep('copy')
    }
  }

  const handleConfirmCopy = () => {
    if (task && copyStartDate && copyEndDate) {
      copyTask(task.id, copyStartDate, copyEndDate)
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
        <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200/50 dark:border-slate-700/50 animate-fade-in">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">카테고리 선택</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{initialDate}</p>
            </div>
          </div>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {categories.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  카테고리를 먼저 추가해주세요
                </p>
              </div>
            ) : (
              categories
                .sort((a, b) => a.order - b.order)
                .map((cat, index) => (
                  <button
                    key={cat.id}
                    onClick={() => handleCategorySelect(cat.id)}
                    className="w-full flex items-center gap-3 p-4 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all duration-200 border border-slate-100 dark:border-slate-700/50 hover:border-slate-200 dark:hover:border-slate-600 hover:shadow-sm animate-slide-in active:scale-[0.98]"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex-shrink-0 shadow-sm"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-slate-700 dark:text-white font-medium">{cat.name}</span>
                    <svg className="w-5 h-5 ml-auto text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))
            )}
          </div>
          <button
            onClick={handleClose}
            className="w-full mt-5 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
          >
            취소
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200/50 dark:border-slate-700/50 overflow-hidden animate-fade-in">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {!task && (
              <button
                onClick={handleBack}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            {selectedCategory && (
              <div
                className="w-10 h-10 rounded-xl flex-shrink-0 shadow-lg flex items-center justify-center"
                style={{ backgroundColor: selectedCategory.color }}
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
            <div className="flex-1">
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">
                {task ? '할 일 수정' : '새 할 일'}
              </h2>
              {selectedCategory && (
                <p className="text-sm" style={{ color: selectedCategory.color }}>
                  {selectedCategory.name}
                </p>
              )}
            </div>
            {task && (
              <div className="flex gap-2">
                <button
                  onClick={handleCopyTask}
                  className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400"
                >
                  복사
                </button>
                <button
                  onClick={handleToggleComplete}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    task.completed 
                      ? 'bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400' 
                      : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {task.completed ? '미완료' : '완료'}
                </button>
              </div>
            )}
          </div>
        </div>

        {step === 'copy' && task ? (
          <div className="p-5 space-y-4">
            <div className="text-sm text-slate-600 dark:text-slate-300">
              <span className="font-medium">"{task.title}"</span>을(를) 다른 날짜에 복사합니다.
            </div>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">시작일</label>
                <input
                  type="date"
                  value={copyStartDate}
                  onChange={(e) => setCopyStartDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">종료일</label>
                <input
                  type="date"
                  value={copyEndDate}
                  onChange={(e) => setCopyEndDate(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStep('task')}
                className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
              >
                뒤로
              </button>
              <button
                type="button"
                onClick={handleConfirmCopy}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
              >
                복사하기
              </button>
            </div>
          </div>
        ) : (
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="할 일 제목"
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              autoFocus
            />
          </div>
          <div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="상세 메모 (선택사항)"
              rows={3}
              className="w-full px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none text-sm"
            />
          </div>
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">시작일</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 block">종료일</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              알림 날짜 (선택)
            </label>
            <input
              type="date"
              value={reminderDate}
              onChange={(e) => setReminderDate(e.target.value)}
              className="w-full px-3 py-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2 pt-2">
            {task && (
              <button
                type="button"
                onClick={handleDelete}
                className="p-3 bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-200 dark:hover:bg-red-900 transition-colors active:scale-95"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25 active:scale-[0.98]"
            >
              저장
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  )
}
