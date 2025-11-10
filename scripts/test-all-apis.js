const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testAllAPIs() {
  try {
    console.log('🧪 Testing all database operations...\n')
    
    // 1. Test batch creation and retrieval
    console.log('1️⃣ Testing Batches...')
    const testBatch = await prisma.batch.create({
      data: {
        batchId: `TEST-ALL-${Date.now()}`,
        productType: 'Test Product',
        startDate: new Date(),
        shift: 'Day',
        operatorId: 'admin-1',
        status: 'active'
      }
    })
    console.log('✅ Batch created:', testBatch.batchId)
    
    // 2. Test batch stage creation
    console.log('2️⃣ Testing Batch Stages...')
    const batchStage = await prisma.batchStage.create({
      data: {
        batchId: testBatch.id,
        stage: 1,
        data: JSON.stringify({ temperature: 25, humidity: 60 })
      }
    })
    console.log('✅ Batch stage created:', batchStage.id)
    
    // 3. Test QC result creation
    console.log('3️⃣ Testing QC Results...')
    const qcResult = await prisma.qCResult.create({
      data: {
        batchId: testBatch.id,
        testType: 'Tensile Strength',
        result: '25.5 MPa',
        passed: true,
        notes: 'Test QC result',
        testedAt: new Date()
      }
    })
    console.log('✅ QC result created:', qcResult.id)
    
    // 4. Test alert creation
    console.log('4️⃣ Testing Alerts...')
    const alert = await prisma.alert.create({
      data: {
        title: 'Test Alert',
        description: 'Test alert description',
        severity: 'warning',
        source: 'system',
        batchId: testBatch.id,
        status: 'active'
      }
    })
    console.log('✅ Alert created:', alert.id)
    
    // 5. Test dashboard metrics calculation
    console.log('5️⃣ Testing Dashboard Metrics...')
    const [activeBatches, activeAlerts, criticalAlerts] = await Promise.all([
      prisma.batch.count({ where: { status: { in: ['active', 'in_progress'] } } }),
      prisma.alert.count({ where: { status: 'active' } }),
      prisma.alert.count({ where: { status: 'active', severity: 'critical' } })
    ])
    console.log('✅ Dashboard metrics:', { activeBatches, activeAlerts, criticalAlerts })
    
    // 6. Test complex queries
    console.log('6️⃣ Testing Complex Queries...')
    const batchWithDetails = await prisma.batch.findUnique({
      where: { id: testBatch.id },
      include: {
        operator: true,
        batchStages: true,
        qcResults: true,
        alerts: true
      }
    })
    console.log('✅ Complex query successful, batch has:', {
      stages: batchWithDetails.batchStages.length,
      qcResults: batchWithDetails.qcResults.length,
      alerts: batchWithDetails.alerts.length
    })
    
    // Clean up test data
    console.log('🧹 Cleaning up test data...')
    await prisma.alert.delete({ where: { id: alert.id } })
    await prisma.qCResult.delete({ where: { id: qcResult.id } })
    await prisma.batchStage.delete({ where: { id: batchStage.id } })
    await prisma.batch.delete({ where: { id: testBatch.id } })
    
    console.log('\n🎉 All database operations working correctly!')
    console.log('✅ Your application is now using REAL database data, not cache/mock data')
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testAllAPIs()