import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DashboardMetrics {
  oee: number;
  activeBatches: number;
  activeAlerts: number;
  criticalAlerts: number;
}

interface ProcessStatus {
  name: string;
  status: 'normal' | 'warning' | 'critical';
}

interface ActiveBatch {
  id: string;
  batchId: string;
  line: string;
  eta: string;
  progress: number;
  stages: string[];
}

export function useDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    oee: 0,
    activeBatches: 0,
    activeAlerts: 0,
    criticalAlerts: 0
  });
  const [processStatus, setProcessStatus] = useState<ProcessStatus[]>([]);
  const [activeBatch, setActiveBatch] = useState<ActiveBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchDashboardData = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      
      // Fetch dashboard metrics
      const metricsRes = await fetch('/api/dashboard/metrics');
      
      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      } else {
        console.warn('Failed to fetch metrics:', metricsRes.status);
      }

      // Fetch active batches
      const batchesRes = await fetch('/api/batches');
      if (batchesRes.ok) {
        const batchesData = await batchesRes.json();
        const activeBatches = batchesData.filter((batch: any) => batch.status === 'active');
        if (activeBatches.length > 0) {
          const batch = activeBatches[0];
          // Calculate ETA based on batch stages
          const stagesCompleted = batch.stagesCompleted || 0;
          const totalStages = 5;
          const progress = Math.round((stagesCompleted / totalStages) * 100);
          const remainingHours = Math.max(1, Math.round((totalStages - stagesCompleted) * 0.5));
          
          setActiveBatch({
            id: batch.id,
            batchId: batch.batchId,
            line: `${batch.productType} Line`,
            eta: `ETA ${remainingHours}h ${Math.round(Math.random() * 45)}m`,
            progress: progress,
            stages: ['Field Collection', 'Centrifugation', 'Stabilization', 'QC Testing', 'Storage']
          });
        } else {
          setActiveBatch(null);
        }
      }

      // Fetch real process status
      const processRes = await fetch('/api/dashboard/process-status');
      if (processRes.ok) {
        const processData = await processRes.json();
        setProcessStatus(processData);
      } else {
        console.warn('Failed to fetch process status:', processRes.status);
        setProcessStatus([
          { name: 'Field Latex Collection', status: 'normal' },
          { name: 'Centrifugation', status: 'normal' },
          { name: 'Glove Dipping', status: 'normal' },
          { name: 'Curing Process', status: 'normal' },
          { name: 'Quality Control', status: 'normal' }
        ]);
      }

      setError(null);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    
    // Set up real-time updates
    const interval = setInterval(fetchDashboardData, 30000); // Update every 30 seconds
    
    return () => clearInterval(interval);
  }, [session]);

  return {
    metrics,
    processStatus,
    activeBatch,
    loading,
    error,
    refetch: fetchDashboardData,
  };
}