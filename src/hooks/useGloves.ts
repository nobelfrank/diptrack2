import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface GloveBatch {
  id: string;
  gloveBatchId: string;
  latexBatchId: string;
  productType: string;
  manufacturingDate: string;
  status: string;
  continuousData: string;
  processData: string;
  qcData: string;
  latexBatch: {
    batchId: string;
    productType: string;
  };
  gloveQcResults: GloveQCResult[];
}

interface GloveQCResult {
  id: string;
  gloveBatchId: string;
  testName: string;
  testType: string;
  inputs: string;
  result: string;
  calculatedValue?: number;
  target: string;
  status: string;
  testedAt: string;
}

export function useGloves() {
  const [gloveBatches, setGloveBatches] = useState<GloveBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchGloveBatches = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Fetching glove batches from API...');
      setLoading(true);
      const response = await fetch('/api/gloves');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.length} glove batches from database`);
      setGloveBatches(data);
      setError(null);
    } catch (err) {
      console.error('Fetch glove batches error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createGloveBatch = async (data: {
    gloveBatchId: string;
    latexBatchId: string;
    productType: string;
    continuousData?: any;
    processData?: any;
    qcData?: any;
  }) => {
    try {
      console.log('📝 Creating glove batch:', data);
      const response = await fetch('/api/gloves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to create glove batch');
      }

      const newBatch = await response.json();
      console.log('✅ Glove batch created successfully:', newBatch.id);
      setGloveBatches(prev => [newBatch, ...prev]);
      return newBatch;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create glove batch');
    }
  };

  useEffect(() => {
    fetchGloveBatches();
  }, [session]);

  return {
    gloveBatches,
    loading,
    error,
    createGloveBatch,
    refetch: fetchGloveBatches,
  };
}