const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function addSampleUsers() {
  try {
    console.log('👥 Adding sample users with departments...')

    // Get departments
    const departments = await prisma.department.findMany()
    const productionDept = departments.find(d => d.name === 'Production')
    const qcDept = departments.find(d => d.name === 'Quality Control')
    const maintenanceDept = departments.find(d => d.name === 'Maintenance')

    const sampleUsers = [
      {
        email: 'supervisor@diptrack.com',
        password: 'supervisor123',
        fullName: 'Sarah Johnson',
        departmentId: productionDept?.id,
        primaryFunction: 'Production Supervisor',
        roles: ['supervisor']
      },
      {
        email: 'qc.officer@diptrack.com', 
        password: 'qc123',
        fullName: 'Mike Chen',
        departmentId: qcDept?.id,
        primaryFunction: 'QC Officer',
        roles: ['qc_officer']
      },
      {
        email: 'maintenance@diptrack.com',
        password: 'maintenance123', 
        fullName: 'David Rodriguez',
        departmentId: maintenanceDept?.id,
        primaryFunction: 'Maintenance Technician',
        roles: ['operator']
      }
    ]

    for (const userData of sampleUsers) {
      const user = await prisma.user.upsert({
        where: { email: userData.email },
        update: {},
        create: {
          email: userData.email,
          password: await bcrypt.hash(userData.password, 10),
          fullName: userData.fullName
        }
      })

      // Create profile
      await prisma.profile.upsert({
        where: { id: user.id },
        update: {
          departmentId: userData.departmentId,
          primaryFunction: userData.primaryFunction
        },
        create: {
          id: user.id,
          email: user.email,
          fullName: user.fullName,
          departmentId: userData.departmentId,
          primaryFunction: userData.primaryFunction
        }
      })

      // Add roles
      for (const role of userData.roles) {
        await prisma.userRole.upsert({
          where: {
            userId_role: {
              userId: user.id,
              role: role
            }
          },
          update: {},
          create: {
            userId: user.id,
            role: role
          }
        })
      }

      console.log(`✅ User: ${userData.fullName} (${userData.email})`)
    }

    console.log('\n🎉 Sample users added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding users:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleUsers()