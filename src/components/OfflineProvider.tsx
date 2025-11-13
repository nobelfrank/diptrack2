'use client'

import { useEffect } from 'react'
import { offlineDB } from '@/lib/offline-db'
import { networkStatus } from '@/lib/network-status'
import { syncManager } from '@/lib/sync-manager'

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const initializeOfflineSystem = async () => {
      try {
        console.log('🚀 Initializing offline system...')
        
        // Initialize IndexedDB
        await offlineDB.init()
        console.log('✅ IndexedDB initialized')
        
        // Start network monitoring
        networkStatus.startPeriodicCheck()
        console.log('✅ Network monitoring started')
        
        // Initial sync if online
        if (networkStatus.isOnline) {
          console.log('🌐 Device is online, attempting initial sync...')
          await syncManager.forcSync()
        } else {
          console.log('📱 Device is offline, will sync when online')
        }
        
        console.log('🎉 Offline system ready!')
        
      } catch (error) {
        console.error('❌ Failed to initialize offline system:', error)
      }
    }

    initializeOfflineSystem()
  }, [])

  return <>{children}</>
}