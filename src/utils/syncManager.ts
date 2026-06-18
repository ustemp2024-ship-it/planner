// 동기화 충돌 해결을 위한 고급 동기화 매니저

interface SyncData {
  categories: any[]
  tasks: any[]
  version: number
  lastModified: string
  deviceId: string
}

interface ConflictResolution {
  strategy: 'local' | 'remote' | 'merge' | 'manual'
  localData: SyncData
  remoteData: SyncData
  mergedData?: SyncData
}

class SyncManager {
  private deviceId: string
  private lastSyncVersion: number = 0
  private syncLock: boolean = false

  constructor() {
    // 각 기기마다 고유 ID 생성 (브라우저 localStorage에 저장)
    this.deviceId = this.getOrCreateDeviceId()
  }

  private getOrCreateDeviceId(): string {
    let deviceId = localStorage.getItem('planner-device-id')
    if (!deviceId) {
      deviceId = `device-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem('planner-device-id', deviceId)
    }
    return deviceId
  }

  // 버전 기반 충돌 감지
  detectConflict(localData: SyncData, remoteData: SyncData): boolean {
    // 1. 버전이 다르고
    // 2. 마지막 수정 시간이 다르고
    // 3. 디바이스 ID가 다르면 충돌
    return (
      localData.version !== remoteData.version &&
      localData.lastModified !== remoteData.lastModified &&
      localData.deviceId !== remoteData.deviceId
    )
  }

  // 스마트 병합 전략
  async mergeData(localData: SyncData, remoteData: SyncData): Promise<SyncData> {
    const localTime = new Date(localData.lastModified).getTime()
    const remoteTime = new Date(remoteData.lastModified).getTime()

    // 기본 전략: 최신 데이터 우선
    if (Math.abs(localTime - remoteTime) < 5000) {
      // 5초 이내 동시 수정으로 판단 - 병합 필요
      return this.deepMerge(localData, remoteData)
    }

    // 명확히 한쪽이 최신인 경우
    return localTime > remoteTime ? localData : remoteData
  }

  // 깊은 병합 - 태스크와 카테고리 개별 병합
  private deepMerge(localData: SyncData, remoteData: SyncData): SyncData {
    const mergedTasks = new Map()
    const mergedCategories = new Map()

    // 태스크 병합 - ID 기준으로 최신 것 선택
    const allTasks = [...localData.tasks, ...remoteData.tasks]
    allTasks.forEach(task => {
      const existing = mergedTasks.get(task.id)
      if (!existing || (task.updatedAt && (!existing.updatedAt || new Date(task.updatedAt) > new Date(existing.updatedAt)))) {
        mergedTasks.set(task.id, task)
      }
    })

    // 카테고리 병합
    const allCategories = [...localData.categories, ...remoteData.categories]
    allCategories.forEach(category => {
      const existing = mergedCategories.get(category.id)
      if (!existing || (category.updatedAt && (!existing.updatedAt || new Date(category.updatedAt) > new Date(existing.updatedAt)))) {
        mergedCategories.set(category.id, category)
      }
    })

    return {
      tasks: Array.from(mergedTasks.values()),
      categories: Array.from(mergedCategories.values()),
      version: Math.max(localData.version, remoteData.version) + 1,
      lastModified: new Date().toISOString(),
      deviceId: this.deviceId
    }
  }

  // 동기화 잠금 - 동시 동기화 방지
  async acquireLock(): Promise<boolean> {
    if (this.syncLock) {
      console.log('🔒 동기화 잠김 - 다른 동기화 진행 중')
      return false
    }
    this.syncLock = true
    return true
  }

  releaseLock(): void {
    this.syncLock = false
  }

  // 안전한 동기화
  async safeSync(
    localData: any,
    fetchRemote: () => Promise<any>,
    saveRemote: (data: any) => Promise<void>,
    applyLocal: (data: any) => void
  ): Promise<void> {
    if (!await this.acquireLock()) {
      return
    }

    try {
      // 1. 원격 데이터 가져오기
      const remoteData = await fetchRemote()
      
      // 2. 로컬 데이터 준비
      const localSyncData: SyncData = {
        ...localData,
        version: this.lastSyncVersion + 1,
        lastModified: new Date().toISOString(),
        deviceId: this.deviceId
      }

      // 3. 충돌 검사
      if (remoteData && this.detectConflict(localSyncData, remoteData)) {
        console.log('⚠️ 동기화 충돌 감지 - 병합 시작')
        
        // 4. 데이터 병합
        const mergedData = await this.mergeData(localSyncData, remoteData)
        
        // 5. 병합된 데이터 저장
        await saveRemote(mergedData)
        applyLocal(mergedData)
        
        this.lastSyncVersion = mergedData.version
        console.log('✅ 충돌 해결 및 병합 완료')
      } else if (!remoteData || localSyncData.version > remoteData.version) {
        // 로컬이 최신
        await saveRemote(localSyncData)
        this.lastSyncVersion = localSyncData.version
        console.log('⬆️ 로컬 데이터 업로드')
      } else if (remoteData.version > localSyncData.version) {
        // 원격이 최신
        applyLocal(remoteData)
        this.lastSyncVersion = remoteData.version
        console.log('⬇️ 원격 데이터 다운로드')
      }
    } catch (error) {
      console.error('❌ 동기화 실패:', error)
      throw error
    } finally {
      this.releaseLock()
    }
  }

  // 수동 충돌 해결 UI를 위한 메서드
  prepareConflictResolutionUI(localData: SyncData, remoteData: SyncData): ConflictResolution {
    return {
      strategy: 'manual',
      localData,
      remoteData,
      mergedData: this.deepMerge(localData, remoteData)
    }
  }
}

export const syncManager = new SyncManager()
export type { SyncData, ConflictResolution }