// Sync manager for offline/online data synchronization
import { offlineDB, OfflineRecord } from './offline-db'
import { networkStatus } from './network-status'

class SyncManager {
  private syncInProgress = false
  private syncQueue: OfflineRecord[] = []

  constructor() {
    // Auto-sync when coming back online
    networkStatus.addListener((isOnline) => {
      if (isOnline && !this.syncInProgress) {
        this.syncOfflineData()
      }
    })

    // Periodic sync attempt
    setInterval(() => {
      if (networkStatus.isOnline && !this.syncInProgress) {
        this.syncOfflineData()
      }
    }, 60000) // Every minute
  }

  async syncOfflineData(): Promise<void> {
    if (this.syncInProgress) return

    this.syncInProgress = true
    console.log('🔄 Sync: Starting offline data synchronization...')

    try {
      const unsyncedActions = await offlineDB.getUnsyncedActions()
      
      if (unsyncedActions.length === 0) {
        console.log('✅ Sync: No offline data to sync')
        return
      }

      console.log(`🔄 Sync: Found ${unsyncedActions.length} actions to sync`)

      // Sort by timestamp to maintain order
      unsyncedActions.sort((a, b) => a.timestamp - b.timestamp)

      for (const action of unsyncedActions) {
        try {
          await this.syncSingleAction(action)
          await offlineDB.markAsSynced(action.id)
          console.log(`✅ Sync: Successfully synced ${action.table} ${action.action}`)
        } catch (error) {
          console.error(`❌ Sync: Failed to sync ${action.table} ${action.action}:`, error)
          // Continue with other actions even if one fails
        }
      }

      // Clean up old synced actions
      await offlineDB.clearSyncedActions()
      console.log('🎉 Sync: Offline data synchronization completed')

    } catch (error) {
      console.error('❌ Sync: Synchronization failed:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async syncSingleAction(action: OfflineRecord): Promise<void> {
    const { table, action: actionType, data } = action

    switch (table) {
      case 'batches':
        await this.syncBatch(actionType, data)
        break
      case 'qc_results':
        await this.syncQCResult(actionType, data)
        break
      case 'alerts':
        await this.syncAlert(actionType, data)
        break
      case 'field_latex':
        await this.syncFieldLatex(actionType, data)
        break
      case 'gloves':
        await this.syncGloves(actionType, data)
        break
      default:
        console.warn(`Unknown table for sync: ${table}`)
    }
  }

  private async syncBatch(action: string, data: any): Promise<void> {
    const endpoint = '/api/batches'
    
    switch (action) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'update':
        await fetch(`${endpoint}/${data.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
      case 'delete':
        await fetch(`${endpoint}/${data.id}`, {
          method: 'DELETE'
        })
        break
    }
  }

  private async syncQCResult(action: string, data: any): Promise<void> {
    const endpoint = '/api/qc/results'
    
    switch (action) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
    }
  }

  private async syncAlert(action: string, data: any): Promise<void> {
    const endpoint = '/api/alerts'
    
    switch (action) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
    }
  }

  private async syncFieldLatex(action: string, data: any): Promise<void> {
    const endpoint = '/api/latex/field'
    
    switch (action) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
    }
  }

  private async syncGloves(action: string, data: any): Promise<void> {
    const endpoint = '/api/gloves'
    
    switch (action) {
      case 'create':
        await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
        break
    }
  }

  // Manual sync trigger
  async forcSync(): Promise<void> {
    if (networkStatus.isOnline) {
      await this.syncOfflineData()
    } else {
      console.log('📱 Cannot sync: Device is offline')
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{ pendingActions: number; lastSync: number | null }> {
    const unsyncedActions = await offlineDB.getUnsyncedActions()
    return {
      pendingActions: unsyncedActions.length,
      lastSync: null // Could be enhanced to track last sync time
    }
  }
}

export const syncManager = new SyncManager()