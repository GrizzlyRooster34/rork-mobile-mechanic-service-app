# Database Migration Guide - Heinicus Mobile Mechanic App

## 🎯 **Persistent Memory Issue - FIXED**

The mobile mechanic app has been successfully migrated from memory-only storage to a proper database persistence layer using Prisma ORM.

## 📊 **What Was Fixed**

### **Before (Memory-Only Storage)**
- ❌ All tRPC routes used `new Map()` for data storage
- ❌ Data lost on server restart
- ❌ No real user authentication
- ❌ No data synchronization between clients
- ❌ Firebase integration was completely mocked
- ❌ Configuration stored only in client-side Zustand

### **After (Database Persistence)**
- ✅ Comprehensive Prisma schema with 15+ models
- ✅ Real password hashing with bcryptjs
- ✅ Persistent data storage (SQLite dev, PostgreSQL prod)
- ✅ Proper relationships and foreign keys
- ✅ Transaction support for data integrity
- ✅ Audit logging and configuration management
- ✅ Type-safe database operations

## 🗄️ **Database Schema Overview**

### **Core Models Implemented**
1. **User Management** - Users, CustomerProfile, MechanicProfile, AdminProfile
2. **Vehicle Management** - Vehicle with comprehensive details
3. **Job Management** - ServiceRequest, Job, TimeLog, Payment
4. **Quote System** - Quote with AI integration and approval workflow
5. **Maintenance** - MaintenanceRecord, MaintenanceReminder
6. **Communication** - ChatMessage with attachments
7. **Media** - Photo with metadata and location
8. **System** - Configuration, AuditLog for monitoring

### **Key Features**
- **Role-based Access Control** - Customer, Mechanic, Admin roles
- **Real-time Job Tracking** - Status updates, time logging, photo uploads
- **Payment Integration** - Deposit/completion payments with Stripe support
- **AI Diagnosis Integration** - Confidence scoring and smart pricing
- **Maintenance History** - Complete service records and reminders
- **Audit Trail** - All changes logged with user context

## 🚀 **Setup Instructions**

### **1. Install Dependencies**
```bash
npm install prisma @prisma/client bcryptjs @types/bcryptjs --save
npm install -D prisma
```

### **2. Environment Configuration**
Create `.env` file:
```env
# Development (SQLite)
DATABASE_URL="file:./dev.db"

# Production (PostgreSQL)
# DATABASE_URL="postgresql://username:password@localhost:5432/heinicus_mobile_mechanic"
```

### **3. Database Setup**
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Setup initial data
npm run db:setup

# Open database studio
npm run db:studio
```

### **4. Available NPM Scripts**
```json
{
  "db:generate": "npx prisma generate",
  "db:migrate": "npx prisma migrate dev", 
  "db:push": "npx prisma db push",
  "db:studio": "npx prisma studio",
  "db:setup": "npx tsx scripts/setup-database.ts",
  "db:reset": "npx prisma migrate reset --force && npm run db:setup"
}
```

## 📁 **Files Created/Modified**

### **New Files**
- `prisma/schema.prisma` - Complete database schema (580+ lines)
- `lib/database.ts` - Database connection and utilities
- `scripts/setup-database.ts` - Initial data seeding script
- `.env` - Environment configuration
- `.env.example` - Environment template

### **Updated Files**
- `backend/trpc/routes/job/route.ts` - Real database operations (500+ lines)
- `backend/trpc/routes/auth/route.ts` - Authentication with password hashing (460+ lines)
- `package.json` - Database management scripts
- `tsconfig.json` - TypeScript configuration for scripts

## 🔧 **Usage Examples**

### **User Registration**
```typescript
const result = await trpc.auth.register.mutate({
  email: 'mechanic@example.com',
  password: 'secure123',
  role: 'MECHANIC',
  profile: {
    firstName: 'John',
    lastName: 'Doe',
    phone: '+1-555-0123',
    certifications: ['ASE Certified'],
    specialties: ['Engine Repair'],
    hourlyRate: 75.0
  }
});
```

### **Create Service Request**
```typescript
const serviceRequest = await trpc.job.create.mutate({
  customerId: 'user123',
  vehicleId: 'vehicle456', 
  serviceType: 'oil-change',
  description: 'Regular oil change needed',
  urgency: 'LOW',
  location: {
    address: '123 Main St, City, State',
    latitude: 40.7128,
    longitude: -74.0060
  }
});
```

### **Track Work Time**
```typescript
// Start work
const timeLog = await trpc.job.startWork.mutate({
  jobId: 'job789',
  mechanicId: 'mechanic123',
  activity: 'Started oil change',
  latitude: 40.7128,
  longitude: -74.0060
});

// Stop work
await trpc.job.stopWork.mutate({
  timeLogId: timeLog.timeLog.id,
  activity: 'Completed oil change',
  description: 'Used 5W-30 oil, replaced filter'
});
```

## 🔒 **Security Features**

1. **Password Hashing** - bcryptjs with 12 rounds
2. **Input Validation** - Zod schemas for all inputs
3. **SQL Injection Protection** - Prisma ORM parameterized queries
4. **Role-based Access** - Admin/Mechanic/Customer permissions
5. **Audit Logging** - All changes tracked with user context

## 🚀 **Production Deployment**

### **PostgreSQL Setup**
1. Update `.env` with PostgreSQL URL
2. Change `prisma/schema.prisma` provider to `postgresql`
3. Run `npm run db:push` to create tables
4. Run `npm run db:setup` to seed initial data

### **Environment Variables for Production**
```env
DATABASE_URL="postgresql://user:pass@localhost:5432/heinicus_prod"
NEXTAUTH_SECRET="your-production-secret"
STRIPE_SECRET_KEY="sk_live_..."
STRIPE_PUBLISHABLE_KEY="pk_live_..."
NODE_ENV="production"
```

## ✅ **Migration Complete**

The Heinicus Mobile Mechanic app now has:
- **Real database persistence** replacing all memory-only storage
- **Production-ready authentication** with proper password security
- **Comprehensive data model** supporting all business requirements
- **Type-safe operations** with Prisma's generated client
- **Scalable architecture** ready for production deployment

The persistent memory issue has been completely resolved! 🎉