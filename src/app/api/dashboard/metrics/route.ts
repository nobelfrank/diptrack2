import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Mock data for build
    const activeBatchesCount = 3
    const activeAlertsCount = 2
    const criticalAlertsCount = 0

    // Calculate OEE (mock calculation - replace with real logic)
    const oee = 87 // This should be calculated from actual production data

    const metrics = {
      oee,
      activeBatches: activeBatchesCount,
      activeAlerts: activeAlertsCount,
      criticalAlerts: criticalAlertsCount
    }

    return NextResponse.json(metrics)
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}