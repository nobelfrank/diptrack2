const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addDepartments() {
  try {
    console.log('🏢 Adding departments to database...')

    const departments = [
      { name: 'Production', description: 'Manufacturing and production operations' },
      { name: 'Quality Control', description: 'Quality assurance and testing' },
      { name: 'Maintenance', description: 'Equipment maintenance and repair' },
      { name: 'Administration', description: 'Administrative and management functions' },
      { name: 'Research & Development', description: 'Product development and innovation' },
      { name: 'Logistics', description: 'Supply chain and warehouse management' },
      { name: 'Safety & Environment', description: 'Health, safety and environmental compliance' }
    ]

    for (const dept of departments) {
      const department = await prisma.department.upsert({
        where: { name: dept.name },
        update: { description: dept.description },
        create: dept
      })
      console.log(`✅ Department: ${department.name}`)
    }

    console.log('\n🎉 All departments added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding departments:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addDepartments()