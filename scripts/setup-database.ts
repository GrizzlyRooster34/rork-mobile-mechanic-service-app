#!/usr/bin/env tsx

import { prisma, checkDatabaseConnection } from '../lib/database';
import bcrypt from 'bcryptjs';

/**
 * Setup database with initial data for testing
 */
async function setupDatabase() {
  console.log('🚀 Starting database setup...');

  try {
    // Check database connection
    const isConnected = await checkDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }

    // Create sample admin user
    console.log('👤 Creating admin user...');
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@heinicus.com' },
      update: {},
      create: {
        email: 'admin@heinicus.com',
        password: adminPassword,
        role: 'ADMIN',
        adminProfile: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
            permissions: ['all'],
          },
        },
      },
    });

    // Create sample mechanic user
    console.log('🔧 Creating mechanic user...');
    const mechanicPassword = await bcrypt.hash('mechanic123', 12);
    const mechanic = await prisma.user.upsert({
      where: { email: 'mechanic@heinicus.com' },
      update: {},
      create: {
        email: 'mechanic@heinicus.com',
        password: mechanicPassword,
        role: 'MECHANIC',
        mechanicProfile: {
          create: {
            firstName: 'John',
            lastName: 'Mechanic',
            phone: '+1-555-0123',
            licenseNumber: 'MC123456',
            certifications: ['ASE Certified', 'Honda Certified'],
            specialties: ['Engine Repair', 'Brake Service', 'Oil Change'],
            experienceYears: 10,
            hourlyRate: 75.0,
            serviceRadius: 25.0,
            isAvailable: true,
            availableTools: [
              'Basic Hand Tools',
              'Socket Set',
              'Code Scanner',
              'Jack and Jack Stands',
              'Oil Change Equipment'
            ],
            vehicleYear: '2020',
            vehicleMake: 'Ford',
            vehicleModel: 'Transit',
          },
        },
      },
    });

    // Create sample customer user
    console.log('👨‍💼 Creating customer user...');
    const customerPassword = await bcrypt.hash('customer123', 12);
    const customer = await prisma.user.upsert({
      where: { email: 'customer@example.com' },
      update: {},
      create: {
        email: 'customer@example.com',
        password: customerPassword,
        role: 'CUSTOMER',
        customerProfile: {
          create: {
            firstName: 'Jane',
            lastName: 'Customer',
            phone: '+1-555-0456',
            address: '123 Main St',
            city: 'Anytown',
            state: 'CA',
            zipCode: '12345',
            preferredContactMethod: 'app',
            notificationsEnabled: true,
          },
        },
      },
    });

    // Create sample vehicle for customer
    console.log('🚗 Creating sample vehicle...');
    const vehicle = await prisma.vehicle.upsert({
      where: { 
        id: 'sample-vehicle-1' // Using custom ID for upsert
      },
      update: {},
      create: {
        id: 'sample-vehicle-1',
        customerId: customer.customerProfile!.id,
        vin: '1HGCM82633A123456',
        licensePlate: 'ABC123',
        year: '2018',
        make: 'Honda',
        model: 'Civic',
        vehicleType: 'CAR',
        color: 'Blue',
        mileage: 45000,
        engineSize: '2.0L',
        fuelType: 'Gasoline',
        transmission: 'CVT',
        nickname: 'My Honda',
      },
    });

    // Create sample configuration
    console.log('⚙️ Creating system configuration...');
    await prisma.configuration.upsert({
      where: { key: 'pricing.base_labor_rate' },
      update: { value: 85.0 },
      create: {
        key: 'pricing.base_labor_rate',
        value: 85.0,
        description: 'Base hourly labor rate for calculations',
        category: 'pricing',
      },
    });

    await prisma.configuration.upsert({
      where: { key: 'system.emergency_fee_multiplier' },
      update: { value: 1.5 },
      create: {
        key: 'system.emergency_fee_multiplier',
        value: 1.5,
        description: 'Emergency service fee multiplier',
        category: 'pricing',
      },
    });

    await prisma.configuration.upsert({
      where: { key: 'features.ai_diagnosis_enabled' },
      update: { value: true },
      create: {
        key: 'features.ai_diagnosis_enabled',
        value: true,
        description: 'Enable AI-powered diagnosis features',
        category: 'features',
      },
    });

    console.log('✅ Database setup completed successfully!');
    console.log('\n📊 Created users:');
    console.log(`   Admin: admin@heinicus.com (password: admin123)`);
    console.log(`   Mechanic: mechanic@heinicus.com (password: mechanic123)`);
    console.log(`   Customer: customer@example.com (password: customer123)`);
    console.log('\n🚗 Created sample vehicle for customer');
    console.log('⚙️ Created initial system configuration');

    return {
      admin,
      mechanic,
      customer,
      vehicle,
    };

  } catch (error) {
    console.error('❌ Database setup failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Test database operations
 */
async function testDatabaseOperations() {
  console.log('\n🧪 Testing database operations...');

  try {
    // Test user queries
    const userCount = await prisma.user.count();
    console.log(`   Users in database: ${userCount}`);

    // Test relationships
    const customerWithVehicles = await prisma.user.findFirst({
      where: { role: 'CUSTOMER' },
      include: {
        customerProfile: {
          include: {
            vehicles: true,
          },
        },
      },
    });

    console.log(`   Customer has ${customerWithVehicles?.customerProfile?.vehicles.length || 0} vehicles`);

    // Test configuration
    const configs = await prisma.configuration.findMany();
    console.log(`   System configurations: ${configs.length}`);

    console.log('✅ Database operations test passed!');

  } catch (error) {
    console.error('❌ Database operations test failed:', error);
    throw error;
  }
}

// Run setup if executed directly
if (require.main === module) {
  setupDatabase()
    .then(() => testDatabaseOperations())
    .then(() => {
      console.log('\n🎉 Database setup and testing completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Setup failed:', error);
      process.exit(1);
    });
}

export { setupDatabase, testDatabaseOperations };