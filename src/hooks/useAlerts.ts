import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Alert {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  source: string;
  batchId?: string;
  assignedTo?: string;
  status: 'active' | 'acknowledged' | 'resolved';
  createdAt: string;
  updatedAt: string;
}

export function useAlerts() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { data: session } = useSession();

  const fetchAlerts = async () => {
    if (!session) {
      setLoading(false);
      return;
    }
    
    try {
      console.log('🔄 Fetching alerts from API...');
      setLoading(true);
      const response = await fetch('/api/alerts');
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Fetched ${data.length} alerts from database`);
      setAlerts(data);
      setError(null);
    } catch (err) {
      console.error('Fetch alerts error:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: 'acknowledged' }),
      });

      if (!response.ok) {
        throw new Error('Failed to acknowledge alert');
      }

      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, status: 'acknowledged' as const }
            : alert
        )
      );
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to acknowledge alert');
    }
  };

  const assignAlert = async (alertId: string, userId: string) => {
    try {
      const response = await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ assignedTo: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to assign alert');
      }

      setAlerts(prev => 
        prev.map(alert => 
          alert.id === alertId 
            ? { ...alert, assignedTo: userId }
            : alert
        )
      );
    } catch (err) {
      throw new Error(err instanceof Error ? err.message : 'Failed to assign alert');
    }
  };

  useEffect(() => {
    fetchAlerts();
    
    // Set up real-time updates
    const interval = setInterval(fetchAlerts, 15000); // Update every 15 seconds
    
    return () => clearInterval(interval);
  }, [session]);

  return {
    alerts,
    loading,
    error,
    refetch: fetchAlerts,
    acknowledgeAlert,
    assignAlert,
  };
}