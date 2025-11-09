import { useState, useEffect, useCallback, useRef } from 'react';
import { useSession } from 'next-auth/react';

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
      setLoading(true);
      const response = await fetch('/api/batches');
      
      if (!response.ok) {
        const cached = localStorage.getItem('batches-cache');
        if (cached) {
          setBatches(JSON.parse(cached));
          setError('Using cached data');
          return;
        }
        throw new Error('Failed to fetch');
      }
      
      const data = await response.json();
      setBatches(data);
      localStorage.setItem('batches-cache', JSON.stringify(data));
      setError(null);
    } catch (err) {
      const cached = localStorage.getItem('batches-cache');
      if (cached) {
        setBatches(JSON.parse(cached));
        setError('Using cached data');
      } else {
        setError('Failed to load batches');
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
    const response = await fetch('/api/batches', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(batchData),
    });

    if (!response.ok) throw new Error('Failed to create batch');

    const newBatch = await response.json();
    setBatches(prev => [newBatch, ...prev]);
    return newBatch;
  }, []);

  useEffect(() => {
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