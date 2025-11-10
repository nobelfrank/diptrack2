const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function fixDatabase() {
  try {
    console.log('🔧 Fixing database issues...')

    // 1. Ensure admin user exists with correct ID
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@diptrack.com' },
      update: {},
      create: {
        id: 'admin-1',
        email: 'admin@diptrack.com',
        password: await bcrypt.hash('admin123', 10),
        fullName: 'Admin User'
      }
    })
    console.log('✅ Admin user ensured:', adminUser.email)

    // 2. Ensure operator user exists
    const operatorUser = await prisma.user.upsert({
      where: { email: 'operator@diptrack.com' },
      update: {},
      create: {
        email: 'operator@diptrack.com',
        password: await bcrypt.hash('operator123', 10),
        fullName: 'Operator User'
      }
    })
    console.log('✅ Operator user ensured:', operatorUser.email)

    // 3. Create user roles
    await prisma.userRole.upsert({
      where: { 
        userId_role: {
          userId: adminUser.id,
          role: 'admin'
        }
      },
      update: {},
      create: {
        userId: adminUser.id,
        role: 'admin'
      }
    })

    await prisma.userRole.upsert({
      where: { 
        userId_role: {
          userId: operatorUser.id,
          role: 'operator'
        }
      },
      update: {},
      create: {
        userId: operatorUser.id,
        role: 'operator'
      }
    })

    // 4. Fix any batches with invalid operator IDs
    const invalidBatches = await prisma.batch.findMany({
      where: {
        operatorId: 'admin-1'
      }
    })

    if (invalidBatches.length > 0) {
      await prisma.batch.updateMany({
        where: {
          operatorId: 'admin-1'
        },
        data: {
          operatorId: adminUser.id
        }
      })
      console.log(`✅ Fixed ${invalidBatches.length} batches with invalid operator IDs`)
    }

    console.log('🎉 Database fixed successfully!')
    
  } catch (error) {
    console.error('❌ Error fixing database:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixDatabase()