'use client'

import { Card } from "@/components/ui/card";
import { StatusBadge } from "@/components/StatusBadge";
import { BottomNav } from "@/components/BottomNav";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { Button } from "@/components/ui/button";
import { Activity, Bell, Layers, ClipboardCheck, TrendingUp, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useDashboard } from "@/hooks/useDashboard";
import { useAlerts } from "@/hooks/useAlerts";
import { useSession } from "next-auth/react";
import { useMemo, useCallback } from "react";

export default function Dashboard() {
  const { metrics, lineStatus, activeBatch, loading: dashboardLoading } = useDashboard();
  const { alerts, acknowledgeAlert, assignAlert, loading: alertsLoading } = useAlerts();
  const { data: session } = useSession();

  const handleBatchClick = useCallback(() => {
    if (activeBatch) {
      // Navigate to batch details
    }
  }, [activeBatch]);

  const handleAcknowledge = useCallback(async (alertId: string) => {
    try {
      await acknowledgeAlert(alertId);
    } catch (error) {
      console.error('Failed to acknowledge alert:', error);
    }
  }, [acknowledgeAlert]);

  const handleAssign = useCallback(async (alertId: string) => {
    try {
      if (session?.user?.id) {
        await assignAlert(alertId, session.user.id);
      }
    } catch (error) {
      console.error('Failed to assign alert:', error);
    }
  }, [assignAlert, session?.user?.id]);

  const activeAlerts = useMemo(() => 
    alerts.filter(alert => alert.status === 'active').slice(0, 3),
    [alerts]
  );

  const performanceData = useMemo(() => [
    { name: "Theoretical Time", value: 100, color: "hsl(var(--primary))" },
    { name: "Planned Production", value: 95, color: "hsl(var(--primary))" },
    { name: "Machine Run Time", value: 78, color: "hsl(var(--chart-2))" },
    { name: "Target Performance", value: 85, color: "hsl(var(--chart-3))" },
    { name: "Actual Performance", value: 72, color: "hsl(var(--destructive))" },
    { name: "OEE", value: 87, color: "hsl(var(--destructive))" },
  ], []);

  const lossesData = useMemo(() => [
    { category: "Availability", losses: ["Breakdowns", "Setup losses"] },
    { category: "Performance", losses: ["Short-term downtimes", "Slow cycles"] },
    { category: "Quality", losses: ["Startup losses", "Production losses"] },
  ], []);

  return (
    <ProtectedRoute allowedRoles={['admin', 'supervisor', 'operator', 'qc_officer']}>
      <DesktopSidebar />
      <div className="min-h-screen bg-background pb-20 md:pb-8 md:ml-64">
        <Header title="Dashboard" />

        <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-7xl mx-auto">
        {/* Live Pulse Card */}
        <Card className="p-3 sm:p-5 lg:p-6 bg-card border-border">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 mb-3 sm:mb-4">
            <div>
              <h2 className="text-base sm:text-lg font-semibold">Live Pulse</h2>
              <p className="text-xs sm:text-sm text-muted-foreground">Production Overview</p>
            </div>
            <StatusBadge status="stable">Stable</StatusBadge>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">OEE</p>
              <p className="text-xl sm:text-2xl font-bold">{dashboardLoading ? '-' : `${metrics.oee}%`}</p>
              <p className="text-[10px] sm:text-xs text-success flex items-center justify-center sm:justify-start gap-0.5 sm:gap-1">
                <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                <span className="hidden sm:inline">+2.1%</span>
                <span className="sm:hidden">↑2.1%</span>
              </p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Latex Batches</p>
              <p className="text-xl sm:text-2xl font-bold">{dashboardLoading ? '-' : metrics.activeBatches}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">Active</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground sm:hidden">In Progress</p>
            </div>
            <div className="text-center sm:text-left">
              <p className="text-[10px] sm:text-xs text-muted-foreground mb-0.5 sm:mb-1">Alerts</p>
              <p className="text-xl sm:text-2xl font-bold">{dashboardLoading ? '-' : metrics.activeAlerts}</p>
              <p className="text-[10px] sm:text-xs text-critical">{metrics.criticalAlerts} critical</p>
            </div>
          </div>

          {/* Performance Metrics Grid */}
          <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-xl border border-border shadow-sm p-3 sm:p-5 mb-3 sm:mb-4">
            <div className="flex items-center justify-between mb-3 sm:mb-4">
              <h3 className="text-xs sm:text-sm font-semibold bg-gradient-primary bg-clip-text text-transparent">
                Production Performance
              </h3>
              <div className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary animate-pulse" />
                <span className="text-[10px] sm:text-xs font-medium text-primary">Live</span>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {performanceData.map((metric, idx) => (
                <div 
                  key={idx}
                  className="bg-gradient-to-br from-secondary to-secondary/50 rounded-lg p-2 sm:p-3 border border-border/50 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center justify-between mb-1 sm:mb-2">
                    <span className="text-[10px] sm:text-xs font-medium text-muted-foreground truncate pr-1">{metric.name}</span>
                    <div 
                      className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: metric.color }}
                    />
                  </div>
                  <div className="flex items-baseline gap-0.5 sm:gap-1 mb-1 sm:mb-2">
                    <span className="text-lg sm:text-2xl font-bold text-foreground">{metric.value}</span>
                    <span className="text-[10px] sm:text-xs text-muted-foreground">%</span>
                  </div>
                  <div className="w-full bg-background/50 rounded-full h-1 sm:h-1.5 overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${metric.value}%`,
                        backgroundColor: metric.color
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Six Big Losses */}
          <div className="bg-card rounded-lg border border-border p-3 sm:p-4 mb-3 sm:mb-4">
            <h3 className="text-xs sm:text-sm font-semibold mb-2 sm:mb-3">Six Big Losses</h3>
            <div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">
              {lossesData.map((item, idx) => (
                <div 
                  key={idx} 
                  className="bg-chart-1/20 border border-chart-1/30 rounded-lg p-2 sm:p-3 text-center"
                >
                  <h4 className="text-[10px] sm:text-xs font-semibold mb-1 sm:mb-2 text-foreground">{item.category}</h4>
                  {item.losses.map((loss, i) => (
                    <p key={i} className="text-[9px] sm:text-[10px] text-muted-foreground leading-relaxed">• {loss}</p>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Metrics Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div>
              <div className="flex justify-between text-[10px] sm:text-xs mb-1 sm:mb-2">
                <span className="text-muted-foreground">Nitrile Viscosity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-critical via-warning to-success w-[60%]"></div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                <span className="font-medium">42 cP</span>
                <span className="text-muted-foreground hidden sm:inline">Target: 40 cP</span>
                <span className="text-muted-foreground sm:hidden">40 cP</span>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] sm:text-xs mb-1 sm:mb-2">
                <span className="text-muted-foreground">Oven Temp</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 sm:h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-critical via-warning to-success w-[75%]"></div>
                </div>
              </div>
              <div className="flex justify-between text-[10px] sm:text-xs mt-0.5 sm:mt-1">
                <span className="font-medium">192°C</span>
                <span className="text-muted-foreground hidden sm:inline">Target: 185°C</span>
                <span className="text-muted-foreground sm:hidden">185°C</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Lower Section - 2 Column Layout on Desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
        {/* Live Process Status */}
        <Card className="p-3 sm:p-4 lg:p-6 bg-card border-border">
          <div className="flex justify-between items-center mb-3 sm:mb-4">
            <h3 className="text-sm sm:text-base font-semibold">Process Status</h3>
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">Tap for details</span>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : (
              [
                { name: 'Field Latex Collection', status: 'normal' },
                { name: 'Centrifugation', status: 'normal' },
                { name: 'Glove Dipping', status: 'warning' },
                { name: 'Curing Process', status: 'normal' },
                { name: 'Quality Control', status: 'normal' }
              ].map((process, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-xs sm:text-sm">{process.name}</span>
                  <StatusBadge status={process.status as "info" | "critical" | "warning" | "normal" | "stable"}>
                    {process.status === 'normal' ? 'Normal' : process.status === 'warning' ? 'Warning' : 'Critical'}
                  </StatusBadge>
                </div>
              ))
            )}
          </div>
        </Card>

        {/* Active Latex Batch Summary */}
        <Card 
          className="p-3 sm:p-4 lg:p-6 bg-card border-border cursor-pointer hover:shadow-lg transition-shadow"
          onClick={handleBatchClick}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-0 mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold">Active Latex Batch</h3>
            <span className="text-[10px] sm:text-xs text-muted-foreground">
              Concentrate Production
            </span>
          </div>
          <div className="space-y-2 sm:space-y-3">
            {dashboardLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            ) : activeBatch ? (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm sm:text-base font-medium">{activeBatch.batchId}</span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="bg-warning text-warning-foreground hover:bg-warning/90 text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-auto"
                  >
                    Watch
                  </Button>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground">{activeBatch.eta}</p>
                <div className="bg-secondary rounded-full h-1.5 sm:h-2 overflow-hidden">
                  <div className="bg-success h-full" style={{ width: `${activeBatch.progress}%` }}></div>
                </div>
                <p className="text-[10px] sm:text-xs text-muted-foreground leading-relaxed">
                  Field Collection → Centrifugation → Stabilization → QC → Storage
                </p>
              </>
            ) : (
              <p className="text-center text-muted-foreground py-4">No active batches</p>
            )}
          </div>
        </Card>

        </div>

        {/* Active Alerts */}
        <Card className="p-3 sm:p-4 lg:p-6 bg-card border-border lg:col-span-2">
          <div className="flex justify-between items-center mb-2 sm:mb-3">
            <h3 className="text-sm sm:text-base font-semibold">Active Alerts</h3>
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden sm:inline">Tap to view details</span>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
            {alertsLoading ? (
              <div className="flex items-center justify-center py-8 col-span-full">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>Loading alerts...</span>
              </div>
            ) : activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <div key={alert.id} className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm mb-1">{alert.title}</h4>
                      <div className="flex items-center gap-2 mb-1">
                        <StatusBadge status={alert.severity}>
                          {alert.severity.charAt(0).toUpperCase() + alert.severity.slice(1)}
                        </StatusBadge>
                        <span className="text-xs text-muted-foreground">
                          {alert.source} • {new Date(alert.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {alert.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleAcknowledge(alert.id)}
                      disabled={alert.status === 'acknowledged'}
                    >
                      {alert.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
                    </Button>
                    <Button 
                      variant="default" 
                      size="sm" 
                      className="flex-1 bg-primary text-primary-foreground"
                      onClick={() => handleAssign(alert.id)}
                      disabled={!!alert.assignedTo}
                    >
                      {alert.assignedTo ? 'Assigned' : 'Assign'}
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 col-span-full">
                <p className="text-muted-foreground">No active alerts</p>
              </div>
            )}
          </div>
        </Card>
        </div>

        <BottomNav />
      </div>
    </ProtectedRoute>
  );
}