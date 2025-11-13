'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { WifiOff, Wifi, RefreshCw, Database, Clock } from 'lucide-react'
import { networkStatus } from '@/lib/network-status'
import { syncManager } from '@/lib/sync-manager'

export function OfflineStatus() {
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline)
  const [pendingSync, setPendingSync] = useState(0)
  const [syncing, setSyncing] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const unsubscribe = networkStatus.addListener(setIsOnline)
    return unsubscribe
  }, [])

  useEffect(() => {
    const updateSyncStatus = async () => {
      const status = await syncManager.getSyncStatus()
      setPendingSync(status.pendingActions)
    }
    
    updateSyncStatus()
    const interval = setInterval(updateSyncStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleForceSync = async () => {
    if (!isOnline) return
    
    setSyncing(true)
    try {
      await syncManager.forcSync()
      console.log('✅ Manual sync completed')
    } catch (error) {
      console.error('❌ Manual sync failed:', error)
    } finally {
      setSyncing(false)
    }
  }

  // Don't show if online and no pending sync
  if (isOnline && pendingSync === 0) return null

  return (
    <Card className="fixed bottom-20 md:bottom-4 right-4 p-3 bg-card border-border shadow-lg z-50 max-w-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-success" />
          ) : (
            <WifiOff className="w-4 h-4 text-destructive" />
          )}
          
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {isOnline ? 'Online' : 'Offline'}
              </span>
              
              {pendingSync > 0 && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Database className="w-3 h-3" />
                  <span>{pendingSync} pending</span>
                </div>
              )}
            </div>
            
            <p className="text-xs text-muted-foreground">
              {isOnline 
                ? pendingSync > 0 
                  ? 'Data will sync automatically'
                  : 'All data synced'
                : 'Working offline - data will sync when online'
              }
            </p>
          </div>
        </div>

        {isOnline && pendingSync > 0 && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleForceSync}
            disabled={syncing}
            className="flex items-center gap-1"
          >
            <RefreshCw className={`w-3 h-3 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Syncing...' : 'Sync'}
          </Button>
        )}
      </div>

      {showDetails && (
        <div className="mt-3 pt-3 border-t border-border">
          <div className="text-xs text-muted-foreground space-y-1">
            <div className="flex items-center gap-2">
              <Clock className="w-3 h-3" />
              <span>Last check: {new Date().toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Database className="w-3 h-3" />
              <span>IndexedDB: Active</span>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-muted-foreground hover:text-foreground mt-2 w-full text-left"
      >
        {showDetails ? 'Hide details' : 'Show details'}
      </button>
    </Card>
  )
}