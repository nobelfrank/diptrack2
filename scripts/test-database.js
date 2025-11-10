const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function testDatabase() {
  try {
    console.log('🧪 Testing database connection...')
    
    // Test connection
    await prisma.$connect()
    console.log('✅ Database connected successfully')
    
    // Test user query
    const users = await prisma.user.findMany()
    console.log(`✅ Found ${users.length} users`)
    
    // Test batch query
    const batches = await prisma.batch.findMany()
    console.log(`✅ Found ${batches.length} batches`)
    
    console.log('🎉 All database tests passed!')
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

testDatabase()