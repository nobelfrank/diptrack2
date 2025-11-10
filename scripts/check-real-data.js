const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkRealData() {
  try {
    console.log('🔍 Checking actual database data...')
    
    // Check users
    const users = await prisma.user.findMany()
    console.log('\n👥 Users in database:')
    users.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id})`)
    })
    
    // Check batches
    const batches = await prisma.batch.findMany({
      include: {
        operator: true,
        batchStages: true
      }
    })
    console.log(`\n📦 Batches in database: ${batches.length}`)
    batches.forEach(batch => {
      console.log(`  - ${batch.batchId} (${batch.productType}) - Status: ${batch.status}`)
    })
    
    // Test creating a new batch
    console.log('\n🧪 Testing batch creation...')
    const newBatch = await prisma.batch.create({
      data: {
        batchId: `TEST-${Date.now()}`,
        productType: 'Test Product',
        startDate: new Date(),
        shift: 'Day',
        operatorId: users[0]?.id || 'admin-1',
        status: 'draft'
      }
    })
    console.log(`✅ Created batch: ${newBatch.batchId}`)
    
    // Verify it was saved
    const savedBatch = await prisma.batch.findUnique({
      where: { id: newBatch.id }
    })
    console.log(`✅ Verified batch exists: ${savedBatch ? 'YES' : 'NO'}`)
    
    // Clean up test batch
    await prisma.batch.delete({
      where: { id: newBatch.id }
    })
    console.log('🧹 Cleaned up test batch')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

checkRealData()