import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category, Task } from '../types'
import { PRESET_COLORS } from '../types'

interface PlannerStore {
  categories: Category[]
  tasks: Task[]
  currentYear: number

  addCategory: (name: string) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  reorderCategories: (categories: Category[]) => void

  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  toggleTaskComplete: (id: string) => void

  setCurrentYear: (year: number) => void
  nextYear: () => void
  prevYear: () => void

  exportData: () => string
  importData: (json: string) => void
  loadDefaultData: () => Promise<void>
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const useStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
      categories: [],
      tasks: [],
      currentYear: new Date().getFullYear(),

      addCategory: (name) => {
        const { categories } = get()
        const colorIndex = categories.length % PRESET_COLORS.length
        set({
          categories: [
            ...categories,
            {
              id: generateId(),
              name,
              color: PRESET_COLORS[colorIndex],
              order: categories.length,
            },
          ],
        })
      },

      updateCategory: (id, updates) => {
        set({
          categories: get().categories.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })
      },

      deleteCategory: (id) => {
        set({
          categories: get().categories.filter((c) => c.id !== id),
          tasks: get().tasks.filter((t) => t.categoryId !== id),
        })
      },

      reorderCategories: (categories) => {
        set({ categories })
      },

      addTask: (task) => {
        set({
          tasks: [...get().tasks, { ...task, id: generateId() }],
        })
      },

      updateTask: (id, updates) => {
        set({
          tasks: get().tasks.map((t) =>
            t.id === id ? { ...t, ...updates } : t
          ),
        })
      },

      deleteTask: (id) => {
        set({
          tasks: get().tasks.filter((t) => t.id !== id),
        })
      },

      toggleTaskComplete: (id) => {
        set({
          tasks: get().tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })
      },

      setCurrentYear: (year) => {
        set({ currentYear: year })
      },

      nextYear: () => {
        set({ currentYear: get().currentYear + 1 })
      },

      prevYear: () => {
        set({ currentYear: get().currentYear - 1 })
      },

      exportData: () => {
        const { categories, tasks } = get()
        return JSON.stringify({ categories, tasks }, null, 2)
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json)
          if (data.categories && data.tasks) {
            set({ categories: data.categories, tasks: data.tasks })
          }
        } catch (e) {
          console.error('Failed to import data:', e)
        }
      },

      loadDefaultData: async () => {
        const { categories } = get()
        if (categories.length > 0) return
        try {
          const res = await fetch('/default-data.json')
          const data = await res.json()
          if (data.categories && data.tasks) {
            set({ categories: data.categories, tasks: data.tasks })
          }
        } catch (e) {
          console.error('Failed to load default data:', e)
        }
      },
    }),
    {
      name: 'planner-storage',
      partialize: (state) => ({
        categories: state.categories,
        tasks: state.tasks,
        currentYear: state.currentYear,
      }),
    }
  )
)
