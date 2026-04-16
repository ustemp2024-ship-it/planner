import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Category, Task } from '../types'
import { PRESET_COLORS } from '../types'
import { uploadToDrive, downloadFromDrive, type SyncData } from '../utils/googleDrive'

interface PlannerStore {
  categories: Category[]
  tasks: Task[]
  currentYear: number
  hiddenCategories: string[]
  lastSyncTime: string | null
  isSyncing: boolean

  addCategory: (name: string) => void
  updateCategory: (id: string, updates: Partial<Category>) => void
  deleteCategory: (id: string) => void
  reorderCategories: (categories: Category[]) => void

  addTask: (task: Omit<Task, 'id'>) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  deleteTasks: (ids: string[]) => void
  copyTask: (id: string, newStartDate: string, newEndDate: string, newCategoryId?: string) => void
  toggleTaskComplete: (id: string) => void
  markAllTasksComplete: () => void

  setCurrentYear: (year: number) => void
  nextYear: () => void
  prevYear: () => void

  toggleCategoryVisibility: (id: string) => void
  showAllCategories: () => void

  exportData: () => string
  importData: (json: string) => void
  loadUserData: () => Promise<void>

  syncToDrive: () => Promise<void>
  syncFromDrive: () => Promise<void>
}

const generateId = () => Math.random().toString(36).substring(2, 9)

export const useStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
      categories: [],
      tasks: [],
      currentYear: new Date().getFullYear(),
      hiddenCategories: [],
      lastSyncTime: null,
      isSyncing: false,

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

      deleteTasks: (ids) => {
        const idSet = new Set(ids)
        set({
          tasks: get().tasks.filter((t) => !idSet.has(t.id)),
        })
      },

      copyTask: (id, newStartDate, newEndDate, newCategoryId) => {
        const task = get().tasks.find((t) => t.id === id)
        if (task) {
          set({
            tasks: [...get().tasks, {
              ...task,
              id: generateId(),
              categoryId: newCategoryId || task.categoryId,
              startDate: newStartDate,
              endDate: newEndDate,
              completed: false,
            }],
          })
        }
      },

      toggleTaskComplete: (id) => {
        set({
          tasks: get().tasks.map((t) =>
            t.id === id ? { ...t, completed: !t.completed } : t
          ),
        })
      },

      markAllTasksComplete: () => {
        set({
          tasks: get().tasks.map((t) => ({ ...t, completed: true })),
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

      toggleCategoryVisibility: (id) => {
        const { hiddenCategories } = get()
        if (hiddenCategories.includes(id)) {
          set({ hiddenCategories: hiddenCategories.filter(c => c !== id) })
        } else {
          set({ hiddenCategories: [...hiddenCategories, id] })
        }
      },

      showAllCategories: () => {
        set({ hiddenCategories: [] })
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

      loadUserData: async () => {
        const { categories } = get()
        if (categories.length > 0) return
        
        try {
          // Google Drive에서 사용자 데이터 먼저 시도
          const driveData = await downloadFromDrive()
          if (driveData && driveData.categories && driveData.tasks) {
            set({ 
              categories: driveData.categories as Category[], 
              tasks: driveData.tasks as Task[],
              lastSyncTime: new Date().toISOString()
            })
            return
          }
        } catch (e: any) {
          console.warn('Failed to load from Google Drive:', e)
          // Google Drive API 오류 시 인증 재확인 필요할 수 있음
          if (e.message?.includes('401') || e.message?.includes('403')) {
            console.error('Authentication error, user may need to re-login')
          }
        }
        
        // Google Drive에 데이터가 없으면 완전 빈 상태로 시작
        // 보안상 기본 데이터는 로드하지 않음
        console.info('Starting with empty state - no data in Google Drive')
      },

      syncToDrive: async () => {
        const { categories, tasks } = get()
        set({ isSyncing: true })
        try {
          const data: SyncData = {
            categories,
            tasks,
            lastModified: new Date().toISOString(),
          }
          await uploadToDrive(data)
          set({ lastSyncTime: new Date().toISOString(), isSyncing: false })
        } catch (e) {
          console.error('Failed to sync to Drive:', e)
          set({ isSyncing: false })
          throw e
        }
      },

      syncFromDrive: async () => {
        set({ isSyncing: true })
        try {
          const data = await downloadFromDrive()
          if (data && data.categories && data.tasks) {
            set({
              categories: data.categories as Category[],
              tasks: data.tasks as Task[],
              lastSyncTime: new Date().toISOString(),
              isSyncing: false,
            })
          } else {
            set({ isSyncing: false })
          }
        } catch (e) {
          console.error('Failed to sync from Drive:', e)
          set({ isSyncing: false })
          throw e
        }
      },
    }),
    {
      name: 'planner-storage',
      partialize: (state) => ({
        categories: state.categories,
        tasks: state.tasks,
        currentYear: state.currentYear,
        hiddenCategories: state.hiddenCategories,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
)
