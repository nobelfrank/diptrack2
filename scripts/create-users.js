require('dotenv').config({ path: '.env.local' });
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

async function createUsers() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Creating users...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@diptrack.com' },
      update: {},
      create: {
        id: 'admin-1',
        email: 'admin@diptrack.com',
        password: adminPassword,
        fullName: 'Admin User'
      }
    });
    
    await prisma.userRole.upsert({
      where: { userId_role: { userId: admin.id, role: 'admin' } },
      update: {},
      create: { userId: admin.id, role: 'admin' }
    });
    
    // Create operator user  
    const operatorPassword = await bcrypt.hash('operator123', 12);
    const operator = await prisma.user.upsert({
      where: { email: 'operator@diptrack.com' },
      update: {},
      create: {
        id: 'operator-1',
        email: 'operator@diptrack.com', 
        password: operatorPassword,
        fullName: 'Operator User'
      }
    });
    
    await prisma.userRole.upsert({
      where: { userId_role: { userId: operator.id, role: 'operator' } },
      update: {},
      create: { userId: operator.id, role: 'operator' }
    });
    
    console.log('✅ Users created successfully!');
    console.log('Admin:', admin.email);
    console.log('Operator:', operator.email);
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createUsers();