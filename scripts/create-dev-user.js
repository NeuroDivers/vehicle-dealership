// Script to create a dev user for the vehicle dealership admin
// Run with: node scripts/create-dev-user.js

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createDevUser() {
  try {
    // Default password - CHANGE THIS IN PRODUCTION
    const defaultPassword = 'Dev@2024!';
    const hashedPassword = await bcrypt.hash(defaultPassword, 12);

    // Create or update the dev user
    const devUser = await prisma.staff.upsert({
      where: { email: 'nick@neurodivers.ca' },
      update: {
        name: 'Nick (Dev)',
        password: hashedPassword,
        role: 'dev', // Developer role with full permissions
        position: 'System Developer',
        phone: '',
        isActive: true,
        lastLogin: new Date(),
      },
      create: {
        email: 'nick@neurodivers.ca',
        name: 'Nick (Dev)',
        password: hashedPassword,
        role: 'dev', // Developer role with full permissions
        position: 'System Developer',
        phone: '',
        isActive: true,
      },
    });

    console.log('✅ Dev user created successfully!');
    console.log('=====================================');
    console.log('Email: nick@neurodivers.ca');
    console.log('Password: Dev@2024!');
    console.log('Role: Developer (Full Access)');
    console.log('=====================================');
    console.log('');
    console.log('🔐 Security Notes:');
    console.log('- Change the password after first login');
    console.log('- This account has full system access');
    console.log('- Can modify all settings and permissions');
    console.log('');
    console.log('🚀 Features Available:');
    console.log('- Full admin dashboard access');
    console.log('- AI features configuration');
    console.log('- Social media automation');
    console.log('- API key management');
    console.log('- Permission management for other users');
    console.log('- Analytics and reporting');
    console.log('');
    console.log('Login at: /auth/signin');

  } catch (error) {
    console.error('❌ Error creating dev user:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
createDevUser();
