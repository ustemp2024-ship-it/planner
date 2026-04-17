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
  hasConflicts: boolean
  conflictCount: number

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
  clearConflicts: () => void
}

const generateId = () => Math.random().toString(36).substring(2, 9)

// 스마트 데이터 병합 함수
interface MergeData {
  local: { categories: Category[], tasks: Task[] }
  remote: { categories: Category[], tasks: Task[] }
  lastSyncTime: string | null
  remoteLastModified: string
}

interface MergeResult {
  categories: Category[]
  tasks: Task[]
  hasConflicts: boolean
}

const smartMergeData = (data: MergeData): MergeResult => {
  const { local, remote, lastSyncTime, remoteLastModified } = data
  let hasConflicts = false
  
  // 마지막 동기화 이후 로컬 변경사항이 있는지 확인
  const hasLocalChanges = !lastSyncTime || new Date(lastSyncTime) < new Date(remoteLastModified)
  
  if (!hasLocalChanges) {
    // 로컬 변경사항이 없으면 원격 데이터 사용
    return { categories: remote.categories, tasks: remote.tasks, hasConflicts: false }
  }
  
  // 카테고리 병합 (ID 기반)
  const categoryMap = new Map<string, Category>()
  
  // 원격 카테고리 먼저 추가
  remote.categories.forEach(cat => categoryMap.set(cat.id, cat))
  
  // 로컬 카테고리 추가/업데이트
  local.categories.forEach(localCat => {
    const remoteCat = categoryMap.get(localCat.id)
    if (!remoteCat) {
      // 새로운 로컬 카테고리
      categoryMap.set(localCat.id, localCat)
    } else {
      // 이름이 다르면 충돌 (로컬 우선)
      if (remoteCat.name !== localCat.name) {
        hasConflicts = true
        console.warn(`Category conflict: ${remoteCat.name} vs ${localCat.name}`)
      }
      categoryMap.set(localCat.id, localCat) // 로컬 우선
    }
  })
  
  // 태스크 병합 (ID 기반, 더 복잡한 로직)
  const taskMap = new Map<string, Task>()
  
  // 원격 태스크 먼저 추가
  remote.tasks.forEach(task => taskMap.set(task.id, task))
  
  // 로컬 태스크 추가/업데이트
  local.tasks.forEach(localTask => {
    const remoteTask = taskMap.get(localTask.id)
    if (!remoteTask) {
      // 새로운 로컬 태스크
      taskMap.set(localTask.id, localTask)
    } else {
      // 태스크 내용이 다르면 충돌 처리
      if (remoteTask.title !== localTask.title || 
          remoteTask.completed !== localTask.completed ||
          remoteTask.categoryId !== localTask.categoryId) {
        hasConflicts = true
        console.warn(`Task conflict detected: ${localTask.title}`)
      }
      taskMap.set(localTask.id, localTask) // 로컬 우선
    }
  })
  
  return {
    categories: Array.from(categoryMap.values()).sort((a, b) => a.order - b.order),
    tasks: Array.from(taskMap.values()),
    hasConflicts
  }
}

export const useStore = create<PlannerStore>()(
  persist(
    (set, get) => ({
        categories: [],
        tasks: [],
        currentYear: new Date().getFullYear(),
        hiddenCategories: [],
        lastSyncTime: null,
        isSyncing: false,
        hasConflicts: false,
        conflictCount: 0,

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
        // 항상 로컬 캐시 무시하고 Google Drive에서 강제 로드
        console.log('🔄 Force loading user data from Google Drive (ignoring local cache)...')
        
        try {
          const driveData = await downloadFromDrive()
          if (driveData && driveData.categories && driveData.tasks) {
            console.log('✅ Found data in Google Drive:', {
              categories: driveData.categories.length,
              tasks: driveData.tasks.length
            })
            
            // 완전히 새로운 상태로 교체
            set({ 
              categories: driveData.categories as Category[], 
              tasks: driveData.tasks as Task[],
              currentYear: new Date().getFullYear(),
              hiddenCategories: [],
              lastSyncTime: new Date().toISOString(),
              isSyncing: false,
              hasConflicts: false,
              conflictCount: 0
            })
            console.log('✅ Successfully replaced all data from Google Drive')
            return
          } else {
            console.log('❌ No valid data found in Google Drive')
          }
        } catch (e: any) {
          console.error('❌ Failed to load from Google Drive:', e)
          if (e.message?.includes('401') || e.message?.includes('403')) {
            console.error('🔒 Authentication error - user may need to re-login')
            throw new Error('Google Drive authentication failed')
          }
        }
        
        // Google Drive에 데이터가 없으면 완전 빈 상태로 시작
        console.info('🆕 Starting with completely empty state')
        set({
          categories: [],
          tasks: [],
          currentYear: new Date().getFullYear(),
          hiddenCategories: [],
          lastSyncTime: null,
          isSyncing: false,
          hasConflicts: false,
          conflictCount: 0
        })
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
            const { categories: localCategories, tasks: localTasks, lastSyncTime } = get()
            
            // 스마트 병합: 타임스탬프 기반으로 충돌 해결
            const mergedData = smartMergeData({
              local: { categories: localCategories, tasks: localTasks },
              remote: { categories: data.categories as Category[], tasks: data.tasks as Task[] },
              lastSyncTime,
              remoteLastModified: data.lastModified
            })
            
            set({
              categories: mergedData.categories,
              tasks: mergedData.tasks,
              lastSyncTime: new Date().toISOString(),
              isSyncing: false,
            })
            
            // 충돌이 발생했다면 상태 업데이트
            if (mergedData.hasConflicts) {
              console.warn('Data conflicts detected and resolved automatically')
              set({ hasConflicts: true, conflictCount: get().conflictCount + 1 })
            }
          } else {
            set({ isSyncing: false })
          }
        } catch (e) {
          console.error('Failed to sync from Drive:', e)
          set({ isSyncing: false })
          throw e
        }
      },

      clearConflicts: () => {
        set({ hasConflicts: false })
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
