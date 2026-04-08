import { useState } from 'react'
import { useStore } from '../store/useStore'

interface SelectionToolbarProps {
  selectedTasks: Set<string>
  onClearSelection: () => void
  onExitSelectionMode: () => void
}

export function SelectionToolbar({ selectedTasks, onClearSelection, onExitSelectionMode }: SelectionToolbarProps) {
  const { deleteTasks } = useStore()
  const [showConfirm, setShowConfirm] = useState(false)

  const handleDelete = () => {
    deleteTasks(Array.from(selectedTasks))
    onClearSelection()
    onExitSelectionMode()
    setShowConfirm(false)
  }

  const count = selectedTasks.size

  return (
    <>
      <div className="fixed bottom-0 left-0 right-0 glass border-t border-white/20 dark:border-slate-700/50 safe-area-bottom z-50 animate-slide-up">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={onExitSelectionMode}
            className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-all active:scale-95"
          >
            취소
          </button>
          
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
              {count}개 선택됨
            </span>
          </div>

          <button
            onClick={() => count > 0 && setShowConfirm(true)}
            disabled={count === 0}
            className={`px-4 py-2 rounded-xl font-medium transition-all active:scale-95 ${
              count > 0
                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30'
                : 'bg-slate-300 dark:bg-slate-600 text-slate-500 dark:text-slate-400 cursor-not-allowed'
            }`}
          >
            삭제
          </button>
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 mx-4 max-w-sm w-full shadow-2xl animate-scale-in">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
              일정 삭제
            </h3>
            <p className="text-slate-600 dark:text-slate-300 mb-6">
              선택한 {count}개의 일정을 삭제하시겠습니까?
              <br />
              <span className="text-sm text-red-500">이 작업은 되돌릴 수 없습니다.</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium transition-all active:scale-95"
              >
                취소
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white font-medium shadow-lg shadow-red-500/30 transition-all active:scale-95"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
