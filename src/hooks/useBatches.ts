import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { cacheManager } from '@/lib/cache-manager';

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

export function useBatches() {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchBatches = useCallback(async () => {
    try {
      console.log('🔄 Fetching batches from API...');
      setLoading(true);
      const response = await fetch('/api/batches', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      if (!response.ok) {
        const cached = localStorage.getItem('batches-cache');
        if (cached) {
          const cachedData = JSON.parse(cached);
          setBatches(cachedData);
          setError('Using cached data - server unavailable');
          return;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if response is an error object
      if (data.error) {
        const cached = cacheManager.get('batches');
        if (cached) {
          setBatches(cached);
          setError('Database error - using cached data');
          return;
        }
        throw new Error(data.error);
      }
      
      const validData = Array.isArray(data) ? data : [];
      console.log(`✅ Fetched ${validData.length} batches from database`);
      setBatches(validData);
      cacheManager.set('batches', validData, 10); // Cache for 10 minutes
      setError(null);
    } catch (err) {
      console.error('Fetch batches error:', err);
      const cached = cacheManager.get('batches');
      if (cached) {
        setBatches(cached);
        setError('Network error - using cached data');
      } else {
        setBatches([]);
        setError('Failed to load batches - no cache available');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const createBatch = useCallback(async (batchData: {
    productType: string;
    latexBatchId: string;
    shift: string;
  }) => {
    try {
      console.log('📝 Creating batch:', batchData);
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(batchData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const newBatch = await response.json();
      console.log('✅ Batch created successfully:', newBatch.batchId);
      
      // Update state and cache immediately
      setBatches(prev => {
        const updated = [newBatch, ...prev];
        cacheManager.set('batches', updated, 10);
        return updated;
      });
      
      return newBatch;
    } catch (error) {
      console.error('Create batch error:', error);
      throw error;
    }
  }, []);

  useEffect(() => {
    // Always fetch fresh data first
    fetchBatches();
  }, [fetchBatches]);

  return {
    batches,
    loading,
    error,
    refetch: fetchBatches,
    createBatch,
  };
}