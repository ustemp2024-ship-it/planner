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
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-sm shadow-2xl border border-gray-100 dark:border-gray-700 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="p-5 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold dark:text-white">카테고리 관리</h2>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          <div className="flex gap-2 mb-5">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="새 카테고리 이름"
              className="flex-1 px-4 py-3 border border-gray-200 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              onClick={handleAdd}
              className="px-5 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl font-medium hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25"
            >
              추가
            </button>
          </div>

          <div className="space-y-2">
            {categories.length === 0 ? (
              <p className="text-center text-gray-400 py-8">카테고리가 없습니다</p>
            ) : (
              categories
                .sort((a, b) => a.order - b.order)
                .map((cat) => (
                  <div
                    key={cat.id}
                    className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl group hover:bg-gray-100 dark:hover:bg-gray-600 transition-all"
                  >
                    <div className="relative">
                      <div
                        className="w-8 h-8 rounded-full flex-shrink-0 cursor-pointer shadow-md hover:scale-110 transition-transform"
                        style={{ backgroundColor: cat.color }}
                        onClick={() => {
                          const currentIndex = PRESET_COLORS.indexOf(cat.color)
                          const nextIndex = (currentIndex + 1) % PRESET_COLORS.length
                          updateCategory(cat.id, { color: PRESET_COLORS[nextIndex] })
                        }}
                        title="색상 변경"
                      />
                    </div>
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        onBlur={() => handleEdit(cat.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleEdit(cat.id)}
                        className="flex-1 px-3 py-2 border border-blue-300 rounded-lg bg-white dark:bg-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    ) : (
                      <span
                        className="flex-1 dark:text-white cursor-pointer font-medium"
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

        <div className="p-5 border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-xl dark:text-white font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  )
}
