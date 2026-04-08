import type { Task, Category } from '../types'

export interface TaskStats {
  total: number
  completed: number
  rate: number
}

export function calculateTaskStats(tasks: Task[]): TaskStats {
  const total = tasks.length
  const completed = tasks.filter(t => t.completed).length
  const rate = total > 0 ? Math.round((completed / total) * 100) : 0
  return { total, completed, rate }
}

export function calculateStreak(tasks: Task[], today: string): number {
  const completedDates = new Set(
    tasks.filter(t => t.completed).map(t => t.endDate)
  )
  
  let streak = 0
  const date = new Date(today)
  
  while (completedDates.has(date.toISOString().split('T')[0])) {
    streak++
    date.setDate(date.getDate() - 1)
  }
  
  return streak
}

export function getOverdueTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter(t => !t.completed && t.endDate < today)
}

export function getActiveTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter(t => !t.completed && t.startDate <= today && t.endDate >= today)
}

export function getFutureTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter(t => !t.completed && t.startDate > today)
}

export function getTodayTasks(tasks: Task[], today: string): Task[] {
  return tasks.filter(t => t.startDate <= today && t.endDate >= today)
}

export interface CategoryStats extends Category, TaskStats {
  overdue: number
}

export function calculateCategoryStats(
  categories: Category[],
  tasks: Task[],
  today: string
): CategoryStats[] {
  return categories.map(cat => {
    const catTasks = tasks.filter(t => t.categoryId === cat.id)
    const stats = calculateTaskStats(catTasks)
    const overdue = catTasks.filter(t => !t.completed && t.endDate < today).length
    return { ...cat, ...stats, overdue }
  }).sort((a, b) => b.rate - a.rate)
}

export interface MonthStats {
  month: number
  monthName: string
  total: number
  completed: number
  rate: number
}

export function calculateMonthlyStats(tasks: Task[], year: number): MonthStats[] {
  return Array.from({ length: 12 }, (_, i) => {
    const month = String(i + 1).padStart(2, '0')
    const monthStart = `${year}-${month}-01`
    const monthEnd = `${year}-${month}-31`
    const monthTasks = tasks.filter(t => t.startDate >= monthStart && t.startDate <= monthEnd)
    const stats = calculateTaskStats(monthTasks)
    return {
      month: i + 1,
      monthName: `${i + 1}월`,
      ...stats
    }
  })
}

export interface YearStats {
  year: string
  total: number
  completed: number
  rate: number
}

export function calculateYearlyStats(tasks: Task[]): YearStats[] {
  const years = [...new Set(tasks.map(t => t.startDate.substring(0, 4)))].sort()
  return years.map(year => {
    const yearTasks = tasks.filter(t => t.startDate.startsWith(year))
    const stats = calculateTaskStats(yearTasks)
    return { year, ...stats }
  })
}
