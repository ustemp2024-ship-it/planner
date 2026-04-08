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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-sm p-4 shadow-xl max-h-[80vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4 dark:text-white">카테고리 관리</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="새 카테고리"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white"
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          />
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg"
          >
            추가
          </button>
        </div>

        <div className="space-y-2">
          {categories
            .sort((a, b) => a.order - b.order)
            .map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div
                  className="w-6 h-6 rounded-full flex-shrink-0 cursor-pointer border-2 border-white shadow"
                  style={{ backgroundColor: cat.color }}
                  onClick={() => {
                    const currentIndex = PRESET_COLORS.indexOf(cat.color)
                    const nextIndex = (currentIndex + 1) % PRESET_COLORS.length
                    updateCategory(cat.id, { color: PRESET_COLORS[nextIndex] })
                  }}
                />
                {editingId === cat.id ? (
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onBlur={() => handleEdit(cat.id)}
                    onKeyDown={(e) => e.key === 'Enter' && handleEdit(cat.id)}
                    className="flex-1 px-2 py-1 border rounded bg-white dark:bg-gray-600 dark:text-white"
                    autoFocus
                  />
                ) : (
                  <span
                    className="flex-1 dark:text-white cursor-pointer"
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
                  className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900 rounded"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg dark:text-white"
        >
          닫기
        </button>
      </div>
    </div>
  )
}
