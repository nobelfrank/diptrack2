const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function addSampleAlerts() {
  try {
    console.log('🚨 Adding sample alerts for dashboard testing...')

    const sampleAlerts = [
      {
        title: 'Temperature Warning',
        description: 'Curing oven temperature above normal range',
        severity: 'warning',
        source: 'Curing Process',
        status: 'active'
      },
      {
        title: 'Quality Check Required',
        description: 'Batch QC-001 requires immediate quality inspection',
        severity: 'info',
        source: 'Quality Control',
        status: 'active'
      },
      {
        title: 'Centrifuge Maintenance',
        description: 'Scheduled maintenance due for centrifuge unit 2',
        severity: 'warning',
        source: 'Centrifugation',
        status: 'active'
      }
    ]

    for (const alertData of sampleAlerts) {
      const alert = await prisma.alert.create({
        data: alertData
      })
      console.log(`✅ Alert: ${alert.title} (${alert.severity})`)
    }

    console.log('\n🎉 Sample alerts added successfully!')
    
  } catch (error) {
    console.error('❌ Error adding alerts:', error.message)
  } finally {
    await prisma.$disconnect()
  }
}

addSampleAlerts()