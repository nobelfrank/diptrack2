// IndexedDB wrapper for offline data storage
export interface OfflineRecord {
  id: string
  table: string
  data: any
  action: 'create' | 'update' | 'delete'
  timestamp: number
  synced: boolean
}

class OfflineDB {
  private db: IDBDatabase | null = null
  private readonly dbName = 'DipTrackOfflineDB'
  private readonly version = 1

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result

        // Store for offline actions (create, update, delete)
        if (!db.objectStoreNames.contains('offline_actions')) {
          const actionStore = db.createObjectStore('offline_actions', { keyPath: 'id' })
          actionStore.createIndex('table', 'table', { unique: false })
          actionStore.createIndex('synced', 'synced', { unique: false })
        }

        // Cache for read data
        if (!db.objectStoreNames.contains('cached_data')) {
          const cacheStore = db.createObjectStore('cached_data', { keyPath: 'key' })
          cacheStore.createIndex('table', 'table', { unique: false })
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  // Store offline action (create, update, delete)
  async storeOfflineAction(table: string, action: 'create' | 'update' | 'delete', data: any): Promise<string> {
    if (!this.db) await this.init()

    const id = `${table}_${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const record: OfflineRecord = {
      id,
      table,
      data,
      action,
      timestamp: Date.now(),
      synced: false
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_actions'], 'readwrite')
      const store = transaction.objectStore('offline_actions')
      const request = store.add(record)

      request.onsuccess = () => {
        console.log(`📱 Offline: Stored ${action} action for ${table}:`, data)
        resolve(id)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Cache data for offline reading
  async cacheData(table: string, data: any): Promise<void> {
    if (!this.db) await this.init()

    const cacheRecord = {
      key: table,
      table,
      data,
      timestamp: Date.now()
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_data'], 'readwrite')
      const store = transaction.objectStore('cached_data')
      const request = store.put(cacheRecord)

      request.onsuccess = () => {
        console.log(`💾 Cached data for ${table}:`, data.length || 'object')
        resolve()
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get cached data
  async getCachedData(table: string): Promise<any | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['cached_data'], 'readonly')
      const store = transaction.objectStore('cached_data')
      const request = store.get(table)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          console.log(`📖 Retrieved cached data for ${table}`)
          resolve(result.data)
        } else {
          resolve(null)
        }
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Get all unsynced actions
  async getUnsyncedActions(): Promise<OfflineRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_actions'], 'readonly')
      const store = transaction.objectStore('offline_actions')
      const request = store.getAll()
      
      request.onsuccess = () => {
        const allRecords = request.result
        const unsyncedRecords = allRecords.filter(record => !record.synced)
        console.log(`🔄 Found ${unsyncedRecords.length} unsynced actions`)
        resolve(unsyncedRecords)
      }
      request.onerror = () => reject(request.error)
    })
  }

  // Mark action as synced
  async markAsSynced(id: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_actions'], 'readwrite')
      const store = transaction.objectStore('offline_actions')
      const getRequest = store.get(id)

      getRequest.onsuccess = () => {
        const record = getRequest.result
        if (record) {
          record.synced = true
          const putRequest = store.put(record)
          putRequest.onsuccess = () => {
            console.log(`✅ Marked action ${id} as synced`)
            resolve()
          }
          putRequest.onerror = () => reject(putRequest.error)
        } else {
          resolve()
        }
      }
      getRequest.onerror = () => reject(getRequest.error)
    })
  }

  // Clear old synced actions (cleanup)
  async clearSyncedActions(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['offline_actions'], 'readwrite')
      const store = transaction.objectStore('offline_actions')
      const request = store.openCursor()
      
      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result
        if (cursor) {
          if (cursor.value.synced) {
            cursor.delete()
          }
          cursor.continue()
        } else {
          console.log('🧹 Cleared synced actions')
          resolve()
        }
      }
      request.onerror = () => reject(request.error)
    })
  }
}

export const offlineDB = new OfflineDB()