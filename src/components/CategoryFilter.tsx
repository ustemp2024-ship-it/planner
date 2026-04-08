import { useStore } from '../store/useStore'

interface CategoryFilterProps {
  isOpen: boolean
  onClose: () => void
}

export function CategoryFilter({ isOpen, onClose }: CategoryFilterProps) {
  const { categories, hiddenCategories, toggleCategoryVisibility, showAllCategories } = useStore()

  if (!isOpen) return null

  const visibleCount = categories.length - hiddenCategories.length

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-50">
      <div 
        className="bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-sm shadow-2xl border border-slate-200/50 dark:border-slate-700/50 max-h-[70vh] overflow-hidden flex flex-col animate-fade-in"
      >
        <div className="p-5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/30">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">카테고리 필터</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400">{visibleCount}/{categories.length} 표시 중</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-5 flex-1 overflow-y-auto">
          {hiddenCategories.length > 0 && (
            <button
              onClick={showAllCategories}
              className="w-full mb-4 px-4 py-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 rounded-xl text-sm font-medium hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              모두 표시
            </button>
          )}

          <div className="space-y-2">
            {categories
              .sort((a, b) => a.order - b.order)
              .map((cat, index) => {
                const isHidden = hiddenCategories.includes(cat.id)
                return (
                  <button
                    key={cat.id}
                    onClick={() => toggleCategoryVisibility(cat.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all animate-slide-in active:scale-[0.98]
                      ${isHidden 
                        ? 'bg-slate-100 dark:bg-slate-800 opacity-60' 
                        : 'bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700/50 shadow-sm'
                      }`}
                    style={{ animationDelay: `${index * 30}ms` }}
                  >
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${isHidden ? 'opacity-40' : ''}`}
                      style={{ backgroundColor: cat.color }}
                    >
                      {!isHidden && (
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                    <span className={`flex-1 text-left font-medium text-sm ${isHidden ? 'text-slate-400 line-through' : 'text-slate-700 dark:text-white'}`}>
                      {cat.name}
                    </span>
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
                      ${isHidden 
                        ? 'border-slate-300 dark:border-slate-600' 
                        : 'border-emerald-500 bg-emerald-500'
                      }`}
                    >
                      {!isHidden && (
                        <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </button>
                )
              })}
          </div>
        </div>

        <div className="p-5 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 bg-gradient-to-r from-violet-500 to-purple-500 text-white rounded-xl font-medium hover:from-violet-600 hover:to-purple-600 transition-all shadow-lg shadow-violet-500/25 active:scale-[0.98]"
          >
            적용
          </button>
        </div>
      </div>
    </div>
  )
}
