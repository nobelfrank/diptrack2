import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { handleApiError } from '@/lib/api-utils'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    console.log('📊 Process Status API: Fetching process status from database...');
    
    const alerts = await prisma.alert.findMany({
      where: { status: 'active' },
      select: { source: true, severity: true }
    })
    
    const processes = [
      'Field Latex Collection',
      'Centrifugation', 
      'Glove Dipping',
      'Curing Process',
      'Quality Control'
    ]
    
    const processStatus = processes.map(processName => {
      const criticalAlert = alerts.find(alert => 
        alert.source.toLowerCase().includes(processName.toLowerCase().split(' ')[0]) && 
        alert.severity === 'critical'
      )
      
      if (criticalAlert) return { name: processName, status: 'critical' }
      
      const warningAlert = alerts.find(alert => 
        alert.source.toLowerCase().includes(processName.toLowerCase().split(' ')[0]) && 
        alert.severity === 'warning'
      )
      
      if (warningAlert) return { name: processName, status: 'warning' }
      
      return { name: processName, status: 'normal' }
    })
    
    console.log(`📊 Process Status API: Calculated status for ${processStatus.length} processes`);
    return NextResponse.json(processStatus)
  } catch (error) {
    return handleApiError(error, 'Fetch process status')
  }
}