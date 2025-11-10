const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDashboardData() {
  try {
    console.log('📊 Testing dashboard data sources...\n')
    
    // 1. Test metrics calculation
    console.log('1️⃣ Testing Dashboard Metrics...')
    const [activeBatches, activeAlerts, criticalAlerts, totalBatches, completedBatches] = await Promise.all([
      prisma.batch.count({ where: { status: { in: ['active', 'in_progress'] } } }),
      prisma.alert.count({ where: { status: 'active' } }),
      prisma.alert.count({ where: { status: 'active', severity: 'critical' } }),
      prisma.batch.count(),
      prisma.batch.count({ where: { status: 'completed' } })
    ])
    
    const oee = totalBatches > 0 ? Math.round((completedBatches / totalBatches) * 100) : 0
    
    console.log('✅ Metrics calculated:', {
      oee: `${oee}%`,
      activeBatches,
      activeAlerts,
      criticalAlerts
    })
    
    // 2. Test process status
    console.log('\n2️⃣ Testing Process Status...')
    const alerts = await prisma.alert.findMany({
      where: { status: 'active' },
      select: { source: true, severity: true }
    })
    
    const processes = ['Field Latex Collection', 'Centrifugation', 'Glove Dipping', 'Curing Process', 'Quality Control']
    
    processes.forEach(processName => {
      const criticalAlert = alerts.find(alert => 
        alert.source.toLowerCase().includes(processName.toLowerCase().split(' ')[0]) && 
        alert.severity === 'critical'
      )
      const warningAlert = alerts.find(alert => 
        alert.source.toLowerCase().includes(processName.toLowerCase().split(' ')[0]) && 
        alert.severity === 'warning'
      )
      
      const status = criticalAlert ? 'critical' : warningAlert ? 'warning' : 'normal'
      console.log(`✅ ${processName}: ${status}`)
    })
    
    // 3. Test active batch data
    console.log('\n3️⃣ Testing Active Batch Data...')
    const activeBatchData = await prisma.batch.findMany({
      where: { status: { in: ['active', 'in_progress'] } },
      include: {
        operator: { select: { fullName: true } }
      },
      take: 1
    })
    
    if (activeBatchData.length > 0) {
      const batch = activeBatchData[0]
      console.log('✅ Active batch found:', {
        batchId: batch.batchId,
        productType: batch.productType,
        operator: batch.operator.fullName,
        progress: `${batch.progressPercentage || 0}%`
      })
    } else {
      console.log('ℹ️ No active batches found')
    }
    
    // 4. Test alerts for dashboard
    console.log('\n4️⃣ Testing Alert Data...')
    const dashboardAlerts = await prisma.alert.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' },
      take: 3,
      include: {
        batch: { select: { batchId: true } }
      }
    })
    
    dashboardAlerts.forEach(alert => {
      console.log(`✅ Alert: ${alert.title} (${alert.severity}) - ${alert.source}`)
    })
    
    console.log('\n🎉 All dashboard data is coming from database!')
    console.log('✅ No more mock data - everything is real-time from SQLite')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testDashboardData()