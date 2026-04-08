import { useState } from 'react'
import { useStore } from '../store/useStore'
import { PRESET_COLORS } from '../types'

interface CategoryManagerProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoryManager({ isOpen, onClose }: CategoryManagerProps) {
  const { categories, addCategory, updateCategory, deleteCategory } = useStore()
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  if (!isOpen) return null

  const handleAdd = () => {
    if (newName.trim()) {
      addCategory(newName.trim())
      setNewName('')
    }
  }

  const handleEdit = (id: string) => {
    if (editName.trim()) {
      updateCategory(id, { name: editName.trim() })
      setEditingId(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-h-[80vh] overflow-hidden flex flex-col animate-fade-in">
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 dark:text-white">카테고리 관리</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{categories.length}개의 카테고리</p>
            </div>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="새 카테고리 이름"
              className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="px-4 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25 active:scale-95"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                </div>
                <p className="text-slate-500 dark:text-slate-400 font-medium">카테고리가 없습니다</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">위에서 새 카테고리를 추가하세요</p>
              </div>
            ) : (
              categories
                .sort((a, b) => a.order - b.order)
                .map((cat, index) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl group hover:shadow-md border border-slate-100 dark:border-slate-700/50 transition-all animate-slide-in"
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div className="relative">
                      <div
                        className="w-10 h-10 rounded-xl flex-shrink-0 cursor-pointer shadow-md hover:scale-110 transition-transform flex items-center justify-center"
                        style={{ backgroundColor: cat.color }}
                        onClick={() => {
                          const currentIndex = PRESET_COLORS.indexOf(cat.color)
                          const nextIndex = (currentIndex + 1) % PRESET_COLORS.length
                          updateCategory(cat.id, { color: PRESET_COLORS[nextIndex] })
                        }}
                        title="색상 변경"
                      >
                        <svg className="w-4 h-4 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                        </svg>
                      </div>
                    </div>
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleEdit(cat.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEdit(cat.id)}
                        className="flex-1 px-3 py-2 border border-blue-400 rounded-lg bg-white dark:bg-slate-700 dark:text-white focus:ring-2 focus:ring-blue-500 text-sm"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 text-slate-700 dark:text-white cursor-pointer font-medium text-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        onClick={() => {
                          setEditingId(cat.id)
                          setEditName(cat.name)
                        }}
                      >
                        {cat.name}
                      </span>
                    )}
                    <button
                      onClick={() => deleteCategory(cat.id)}
                      className="p-2 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                ))
            )}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-700 dark:text-white font-medium hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors active:scale-[0.98]"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
