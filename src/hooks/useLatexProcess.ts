import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface FieldLatex {
  id: string;
  supplierLotId: string;
  supplier: string;
  receptionDate: string;
  volume: number;
  preservativeAdded: number;
  initialPh: number;
  visualInspection: string;
  ambientTemp: number;
  timeSinceTapping: number;
  status: string;
}

interface ProcessStage {
  id: string;
  batchId: string;
  stageName: string;
  stageNumber: number;
  data: string;
  status: string;
  startedAt?: string;
  completedAt?: string;
}

export function useLatexProcess() {
  const [fieldLatex, setFieldLatex] = useState<FieldLatex[]>([]);
  const [processStages, setProcessStages] = useState<ProcessStage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchFieldLatex = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/latex/field');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setFieldLatex(data);
    } catch (err) {
      console.error('Fetch field latex error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchProcessStages = async (batchId?: string) => {
    if (!session) return;
    
    try {
      const url = batchId ? `/api/latex/process?batchId=${batchId}` : '/api/latex/process';
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch process stages');
      }
      
      const data = await response.json();
      setProcessStages(data);
    } catch (err) {
      console.error('Fetch process stages error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const createFieldLatex = async (data: Omit<FieldLatex, 'id' | 'receptionDate' | 'status'>) => {
    try {
      console.log('📝 Creating field latex:', data);
      const response = await fetch('/api/latex/field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const newRecord = await response.json();
      console.log('✅ Field latex created successfully:', newRecord.id);
      setFieldLatex(prev => [newRecord, ...prev]);
      return newRecord;
    } catch (err) {
      console.error('Create field latex error:', err);
      throw err;
    }
  };

  const createProcessStage = async (data: {
    batchId: string;
    stageName: string;
    stageNumber: number;
    data: any;
  }) => {
    try {
      console.log('📝 Creating process stage:', data);
      const response = await fetch('/api/latex/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const newStage = await response.json();
      console.log('✅ Process stage created successfully:', newStage.id);
      setProcessStages(prev => [newStage, ...prev]);
      return newStage;
    } catch (err) {
      console.error('Create process stage error:', err);
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchFieldLatex(), fetchProcessStages()]);
      setLoading(false);
    };
    
    loadData();
  }, [session]);

  return {
    fieldLatex,
    processStages,
    loading,
    error,
    createFieldLatex,
    createProcessStage,
    fetchProcessStages,
    refetch: () => {
      fetchFieldLatex();
      fetchProcessStages();
    }
  };
}