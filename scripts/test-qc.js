const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testQC() {
  try {
    console.log('🧪 Testing QC database operations...')
    
    // First create a test batch
    const testBatch = await prisma.batch.create({
      data: {
        batchId: `TEST-QC-${Date.now()}`,
        productType: 'Test Product',
        startDate: new Date(),
        shift: 'Day',
        operatorId: 'admin-1',
        status: 'draft'
      }
    })
    console.log('✅ Created test batch:', testBatch.batchId)
    
    // Create QC result
    const qcResult = await prisma.qCResult.create({
      data: {
        batchId: testBatch.id,
        testType: 'Tensile Strength',
        result: '25.5 MPa',
        passed: true,
        notes: 'Test QC result',
        testedAt: new Date()
      },
      include: {
        batch: {
          select: { batchId: true, productType: true }
        }
      }
    })
    console.log('✅ Created QC result:', qcResult.id)
    
    // Fetch all QC results
    const allQcResults = await prisma.qCResult.findMany({
      include: {
        batch: {
          select: { batchId: true, productType: true }
        }
      }
    })
    console.log(`✅ Found ${allQcResults.length} QC results in database`)
    
    // Clean up
    await prisma.qCResult.delete({ where: { id: qcResult.id } })
    await prisma.batch.delete({ where: { id: testBatch.id } })
    console.log('🧹 Cleaned up test data')
    
    console.log('🎉 QC database operations working correctly!')
    
  } catch (error) {
    console.error('❌ QC test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testQC()