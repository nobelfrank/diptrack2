import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface QCResult {
  id: string;
  batchId: string;
  testType: string;
  result: string;
  passed: boolean;
  notes?: string;
  testedAt: string;
  batch: {
    batchId: string;
    productType: string;
  };
}

export function useQC() {
  const [qcResults, setQcResults] = useState<QCResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchQCResults = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Fetching QC results from API...');
      setLoading(true);
      const response = await fetch('/api/qc/results');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.length} QC results from database`);
      setQcResults(data);
      setError(null);
    } catch (err) {
      console.error('Fetch QC results error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const createQCResult = async (qcData: {
    batchId: string;
    testType: string;
    result: string;
    passed: boolean;
    notes?: string;
  }) => {
    try {
      console.log('📝 Creating QC result:', qcData);
      const response = await fetch('/api/qc/results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(qcData),
      });

      if (!response.ok) {
        throw new Error('Failed to create QC result');
      }

      const newResult = await response.json();
      console.log('✅ QC result created successfully:', newResult.id);
      setQcResults(prev => [newResult, ...prev]);
      return newResult;
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create QC result');
    }
  };

  useEffect(() => {
    fetchQCResults();
  }, [session]);

  return {
    qcResults,
    loading,
    error,
    refetch: fetchQCResults,
    createQCResult,
  };
}