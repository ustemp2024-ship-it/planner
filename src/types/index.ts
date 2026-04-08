export interface Category {
  id: string
  name: string
  color: string
  order: number
}

export interface Task {
  id: string
  categoryId: string
  title: string
  startDate: string
  endDate: string
  completed: boolean
}

export const PRESET_COLORS = [
  '#fbbf24',
  '#22c55e',
  '#3b82f6',
  '#ec4899',
  '#f97316',
  '#8b5cf6',
  '#ef4444',
  '#14b8a6',
  '#6366f1',
  '#84cc16',
]
