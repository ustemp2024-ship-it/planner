import type { ReactNode } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const sizes = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg'
}

export function Modal({ 
  isOpen, 
  onClose, 
  title, 
  subtitle, 
  children, 
  footer,
  size = 'sm'
}: ModalProps) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className={`bg-white dark:bg-slate-900 rounded-3xl w-full ${sizes[size]} max-h-[90vh] overflow-hidden shadow-2xl border border-slate-200/50 dark:border-slate-700/50 animate-fade-in flex flex-col`}>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-800 dark:text-white">{title}</h2>
            {subtitle && (
              <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
            )}
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
        
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
        
        {footer && (
          <div className="p-5 border-t border-slate-100 dark:border-slate-800 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
