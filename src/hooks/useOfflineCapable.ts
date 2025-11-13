// Hook wrapper for offline-capable operations
import { useState, useEffect, useCallback } from 'react'
import { offlineDB } from '@/lib/offline-db'
import { networkStatus } from '@/lib/network-status'
import { syncManager } from '@/lib/sync-manager'

interface UseOfflineCapableOptions {
  table: string
  apiEndpoint: string
  cacheKey: string
}

export function useOfflineCapable<T>({ table, apiEndpoint, cacheKey }: UseOfflineCapableOptions) {
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline)
  const [pendingSync, setPendingSync] = useState(0)

  // Network status listener
  useEffect(() => {
    const unsubscribe = networkStatus.addListener(setIsOnline)
    return unsubscribe
  }, [])

  // Update pending sync count
  useEffect(() => {
    const updateSyncStatus = async () => {
      const status = await syncManager.getSyncStatus()
      setPendingSync(status.pendingActions)
    }
    
    updateSyncStatus()
    const interval = setInterval(updateSyncStatus, 5000)
    return () => clearInterval(interval)
  }, [])

  // Fetch data (online first, fallback to cache)
  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      if (isOnline) {
        console.log(`🌐 Online: Fetching ${table} from API...`)
        const response = await fetch(apiEndpoint, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        })

        if (response.ok) {
          const apiData = await response.json()
          setData(apiData)
          
          // Cache the fresh data
          await offlineDB.cacheData(cacheKey, apiData)
          console.log(`💾 Cached fresh ${table} data`)
          return
        }
      }

      // Fallback to cached data
      console.log(`📱 Offline: Loading ${table} from cache...`)
      const cachedData = await offlineDB.getCachedData(cacheKey)
      
      if (cachedData) {
        setData(cachedData)
        setError(isOnline ? 'Using cached data - server unavailable' : 'Offline mode - using cached data')
      } else {
        setData([])
        setError('No cached data available')
      }

    } catch (err) {
      console.error(`Error fetching ${table}:`, err)
      
      // Try cached data on error
      const cachedData = await offlineDB.getCachedData(cacheKey)
      if (cachedData) {
        setData(cachedData)
        setError('Network error - using cached data')
      } else {
        setData([])
        setError('Failed to load data')
      }
    } finally {
      setLoading(false)
    }
  }, [table, apiEndpoint, cacheKey, isOnline])

  // Create data (offline-capable)
  const createData = useCallback(async (newData: Omit<T, 'id'>) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const dataWithId = { ...newData, id: tempId } as T

    try {

      if (isOnline) {
        console.log(`🌐 Online: Creating ${table} via API...`)
        const response = await fetch(apiEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newData)
        })

        if (response.ok) {
          const createdData = await response.json()
          setData(prev => [createdData, ...prev])
          
          // Update cache
          const updatedData = [createdData, ...data]
          await offlineDB.cacheData(cacheKey, updatedData)
          
          console.log(`✅ Created ${table} successfully`)
          return createdData
        } else {
          throw new Error(`HTTP ${response.status}`)
        }
      } else {
        console.log(`📱 Offline: Storing ${table} creation for later sync...`)
        
        // Store for offline sync
        await offlineDB.storeOfflineAction(table, 'create', newData)
        
        // Update local state immediately
        setData(prev => [dataWithId, ...prev])
        
        // Update cache
        const updatedData = [dataWithId, ...data]
        await offlineDB.cacheData(cacheKey, updatedData)
        
        console.log(`📱 ${table} stored offline, will sync when online`)
        return dataWithId
      }
    } catch (error) {
      console.error(`Error creating ${table}:`, error)
      
      // Store offline even if online creation failed
      await offlineDB.storeOfflineAction(table, 'create', newData)
      setData(prev => [dataWithId, ...prev])
      
      console.log(`📱 ${table} stored offline due to error, will sync when possible`)
      return dataWithId
    }
  }, [table, apiEndpoint, cacheKey, isOnline, data])

  // Force sync
  const forceSync = useCallback(async () => {
    if (isOnline) {
      await syncManager.forcSync()
      await fetchData() // Refresh data after sync
    }
  }, [isOnline, fetchData])

  // Initial data load
  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    isOnline,
    pendingSync,
    refetch: fetchData,
    createData,
    forceSync
  }
}

// Specific hooks for each data type
export function useOfflineBatches() {
  return useOfflineCapable({
    table: 'batches',
    apiEndpoint: '/api/batches',
    cacheKey: 'batches'
  })
}

export function useOfflineQC() {
  return useOfflineCapable({
    table: 'qc_results',
    apiEndpoint: '/api/qc/results',
    cacheKey: 'qc_results'
  })
}

export function useOfflineAlerts() {
  return useOfflineCapable({
    table: 'alerts',
    apiEndpoint: '/api/alerts',
    cacheKey: 'alerts'
  })
}