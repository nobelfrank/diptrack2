require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function setupDatabase() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🗄️ Setting up SQLite database...');
    
    // Create admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    
    const adminUser = await prisma.user.create({
      data: {
        id: 'admin-user-1',
        email: 'admin@diptrack.com',
        password: hashedPassword,
        fullName: 'Admin User'
      }
    });
    
    await prisma.userRole.create({
      data: {
        userId: adminUser.id,
        role: 'admin'
      }
    });
    
    await prisma.profile.create({
      data: {
        id: adminUser.id,
        email: adminUser.email,
        fullName: adminUser.fullName
      }
    });
    
    // Create sample batch
    const batch = await prisma.batch.create({
      data: {
        batchId: 'B001',
        productType: 'Latex Gloves',
        latexBatchId: 'LAT001',
        startDate: new Date(),
        shift: 'Day',
        operatorId: adminUser.id,
        status: 'active',
        currentStage: 2,
        progressPercentage: 40
      }
    });
    
    console.log('✅ Database setup complete!');
    console.log('📊 Admin user: admin@diptrack.com (password: admin123)');
    console.log('📦 Sample batch created:', batch.batchId);
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupDatabase();