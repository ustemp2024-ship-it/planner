import type { ReactNode } from 'react'

interface StatCardProps {
  icon: ReactNode
  label: string
  value: string | number
  subValue?: string
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple'
  size?: 'sm' | 'md'
}

const variants = {
  default: {
    bg: 'bg-slate-50 dark:bg-slate-800/50',
    border: 'border-slate-100 dark:border-slate-700/50',
    iconBg: 'bg-slate-500/20',
    iconColor: 'text-slate-600 dark:text-slate-400',
    textColor: 'text-slate-800 dark:text-white',
    subColor: 'text-slate-500 dark:text-slate-400'
  },
  success: {
    bg: 'bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30',
    border: 'border-emerald-100 dark:border-emerald-800/50',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    subColor: 'text-emerald-600/70 dark:text-emerald-500'
  },
  warning: {
    bg: 'bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/30 dark:to-orange-900/30',
    border: 'border-amber-100 dark:border-amber-800/50',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-600 dark:text-amber-400',
    textColor: 'text-amber-700 dark:text-amber-400',
    subColor: 'text-amber-600/70 dark:text-amber-500'
  },
  danger: {
    bg: 'bg-gradient-to-br from-red-50 to-rose-50 dark:from-red-900/30 dark:to-rose-900/30',
    border: 'border-red-100 dark:border-red-800/50',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-600 dark:text-red-400',
    textColor: 'text-red-700 dark:text-red-400',
    subColor: 'text-red-600/70 dark:text-red-500'
  },
  info: {
    bg: 'bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30',
    border: 'border-blue-100 dark:border-blue-800/50',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-600 dark:text-blue-400',
    textColor: 'text-blue-700 dark:text-blue-400',
    subColor: 'text-blue-600/70 dark:text-blue-500'
  },
  purple: {
    bg: 'bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30',
    border: 'border-violet-100 dark:border-violet-800/50',
    iconBg: 'bg-violet-500/20',
    iconColor: 'text-violet-600 dark:text-violet-400',
    textColor: 'text-violet-700 dark:text-violet-400',
    subColor: 'text-violet-600/70 dark:text-violet-500'
  }
}

export function StatCard({ 
  icon, 
  label, 
  value, 
  subValue,
  variant = 'default',
  size = 'md'
}: StatCardProps) {
  const v = variants[variant]
  
  return (
    <div className={`${v.bg} rounded-2xl p-4 border ${v.border}`}>
      <div className={`w-10 h-10 rounded-xl ${v.iconBg} flex items-center justify-center mb-2`}>
        <div className={v.iconColor}>{icon}</div>
      </div>
      <div className={`${size === 'sm' ? 'text-xl' : 'text-2xl'} font-bold ${v.textColor}`}>
        {value}
      </div>
      <div className={`text-xs ${v.subColor}`}>{label}</div>
      {subValue && (
        <div className={`text-[10px] ${v.subColor} mt-0.5`}>{subValue}</div>
      )}
    </div>
  )
}
