import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { offlineDB } from '@/lib/offline-db';
import { networkStatus } from '@/lib/network-status';
import { syncManager } from '@/lib/sync-manager';

interface Batch {
  id: string;
  batchId: string;
  productType: string;
  latexBatchId: string;
  startDate: string;
  shift: string;
  status: 'active' | 'completed' | 'draft' | 'cancelled';
  currentStage: number;
  stagesCompleted: number;
  progressPercentage: number;
  operator: {
    id: string;
    fullName: string;
    email: string;
  };
  _count: {
    alerts: number;
    qcResults: number;
  };
}

export function useBatchesOffline() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(networkStatus.isOnline);
  const [pendingSync, setPendingSync] = useState(0);
  const { data: session } = useSession();

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

  const fetchBatches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (isOnline) {
        console.log('🌐 Online: Fetching batches from API...');
        const response = await fetch('/api/batches', {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' }
        });

        if (response.ok) {
          const data = await response.json();
          const validData = Array.isArray(data) ? data : [];
          setBatches(validData);
          
          // Cache fresh data in IndexedDB
          await offlineDB.cacheData('batches', validData);
          console.log(`💾 Cached ${validData.length} batches`);
          return;
        }
      }

      // Fallback to IndexedDB cache
      console.log('📱 Loading batches from IndexedDB cache...');
      const cachedData = await offlineDB.getCachedData('batches');
      
      if (cachedData) {
        setBatches(cachedData);
        setError(isOnline ? 'Server unavailable - using cached data' : 'Offline mode - using cached data');
      } else {
        setBatches([]);
        setError('No cached data available');
      }

    } catch (err) {
      console.error('Fetch batches error:', err);
      
      // Try IndexedDB cache on error
      const cachedData = await offlineDB.getCachedData('batches');
      if (cachedData) {
        setBatches(cachedData);
        setError('Network error - using cached data');
      } else {
        setBatches([]);
        setError('Failed to load batches');
      }
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  const createBatch = useCallback(async (batchData: {
    productType: string;
    latexBatchId: string;
    shift: string;
  }) => {
    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const batchWithTempId = { 
      ...batchData, 
      id: tempId, 
      batchId: `TEMP-${tempId.slice(-8)}`,
      startDate: new Date().toISOString(),
      status: 'draft' as const,
      currentStage: 1,
      stagesCompleted: 0,
      progressPercentage: 0,
      operator: { id: 'temp', fullName: 'Temp User', email: 'temp@temp.com' },
      _count: { alerts: 0, qcResults: 0 }
    };

    try {

      if (isOnline) {
        console.log('🌐 Online: Creating batch via API...', batchData);
        const response = await fetch('/api/batches', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(batchData),
        });

        if (response.ok) {
          const newBatch = await response.json();
          console.log('✅ Batch created successfully:', newBatch.batchId);
          
          setBatches(prev => {
            const updated = [newBatch, ...prev];
            offlineDB.cacheData('batches', updated); // Update cache
            return updated;
          });
          
          return newBatch;
        } else {
          throw new Error(`HTTP ${response.status}`);
        }
      } else {
        console.log('📱 Offline: Storing batch creation for sync...', batchData);
        
        // Store for offline sync
        await offlineDB.storeOfflineAction('batches', 'create', batchData);
        
        // Update UI immediately with temp data
        setBatches(prev => {
          const updated = [batchWithTempId, ...prev];
          offlineDB.cacheData('batches', updated); // Update cache
          return updated;
        });
        
        console.log('📱 Batch stored offline, will sync when online');
        return batchWithTempId;
      }
    } catch (error) {
      console.error('Create batch error:', error);
      
      // Store offline even if online creation failed
      await offlineDB.storeOfflineAction('batches', 'create', batchData);
      setBatches(prev => [batchWithTempId, ...prev]);
      
      console.log('📱 Batch stored offline due to error, will sync when possible');
      return batchWithTempId;
    }
  }, [isOnline]);

  // Force sync function
  const forceSync = useCallback(async () => {
    if (isOnline) {
      await syncManager.forcSync();
      await fetchBatches(); // Refresh after sync
    }
  }, [isOnline, fetchBatches]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    loading,
    error,
    isOnline,
    pendingSync,
    refetch: fetchBatches,
    createBatch,
    forceSync,
  };
}