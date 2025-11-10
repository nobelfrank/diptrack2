import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Dashboard API: Fetching metrics from database...');
    
    // Get real counts from database
    const [activeBatchesCount, activeAlertsCount, criticalAlertsCount] = await Promise.all([
      prisma.batch.count({
        where: { status: { in: ['active', 'in_progress'] } }
      }),
      prisma.alert.count({
        where: { status: 'active' }
      }),
      prisma.alert.count({
        where: { 
          status: 'active',
          severity: 'critical'
        }
      })
    ])

    // Calculate OEE based on completed batches (simplified calculation)
    const totalBatches = await prisma.batch.count()
    const completedBatches = await prisma.batch.count({
      where: { status: 'completed' }
    })
    
    const oee = totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0

    const metrics = {
      oee,
      activeBatches: activeBatchesCount,
      activeAlerts: activeAlertsCount,
      criticalAlerts: criticalAlertsCount
    }

    console.log('📊 Dashboard API: Metrics calculated:', metrics);
    return NextResponse.json(metrics)
  } catch (error) {
    return handleApiError(error, 'Fetch dashboard metrics')
  }
}