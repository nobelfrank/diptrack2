'use client'

import { useState, useMemo, useCallback } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import Header from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useSession } from "next-auth/react";
import { useBatches } from "@/hooks/useBatches";

export default function Batches() {
  const router = useRouter();
  const { batches, loading, error, refetch } = useBatches();
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const { data: session } = useSession();
  
  const canCreateBatch = useMemo(() => {
    const roles = session?.user?.roles || [];
    return roles.includes('admin') || roles.includes('operator');
  }, [session?.user?.roles]);

  const filteredBatches = useMemo(() => {
    return batches
      .filter(batch => filter === 'all' || batch.status === filter)
      .filter(batch => !searchQuery || 
        batch.batchId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        batch.productType.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
  }, [batches, filter, searchQuery]);

  const handleBatchClick = useCallback((id: string) => {
    router.push(`/batches/${id}`);
  }, [router]);

  const handleCreateBatch = useCallback(() => {
    router.push('/batches/create');
  }, [router]);

  return (
    <ProtectedRoute allowedRoles={['admin', 'supervisor', 'operator']}>
      <DesktopSidebar />
      <div className="min-h-screen bg-background pb-20 md:pb-8 md:ml-64">
        <Header title="Batches" />
      
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold">Batches</h2>
          <p className="text-sm text-muted-foreground mt-1">Live batches across lines</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
        {canCreateBatch && (
          <Button 
            className="bg-primary text-primary-foreground hover:bg-primary/90 w-full sm:w-auto"
            onClick={handleCreateBatch}
          >
            New Batch
          </Button>
        )}
        </div>
      </div>

      <div className="space-y-3 sm:space-y-4">

        {/* Search and Filters */}
        <div className="flex gap-2 flex-col sm:flex-row">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search batch ID, line, product" 
              className="pl-10 bg-input border-border w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

        </div>

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full shrink-0"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button 
            variant={filter === 'active' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full shrink-0"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'outline'} 
            size="sm" 
            className="rounded-full shrink-0"
            onClick={() => setFilter('completed')}
          >
            Completed
          </Button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              Try Again
            </Button>
          </div>
        )}

        {/* Batch Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {filteredBatches.map((batch) => (
            <Card 
              key={batch.id} 
              className="p-4 lg:p-5 bg-card border-border cursor-pointer hover:border-primary/50 hover:shadow-lg transition-all"
              onClick={() => handleBatchClick(batch.id)}
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{batch.batchId}</h3>
                    <p className="text-sm text-muted-foreground">{batch.productType}</p>
                  </div>
                  <StatusBadge status={batch.status === 'completed' ? 'normal' : batch.status === 'active' ? 'info' : 'normal'}>
                    {batch.status === 'completed' ? 'Completed' : batch.status === 'active' ? 'In Progress' : 'Draft'}
                  </StatusBadge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Stage {batch.currentStage} of 5
                    </span>
                    <span className="font-medium">
                      {Math.round(batch.progressPercentage)}%
                    </span>
                  </div>
                  <Progress value={batch.progressPercentage} className="h-2" />
                </div>

                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <div className="space-y-1">
                    <div>Operator: {batch.operator.fullName}</div>
                    <div>Latex: {batch.latexBatchId}</div>
                  </div>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </Card>
          ))}

            {filteredBatches.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No batches found</p>
              </div>
            )}
          </div>
        )}
      </div>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}