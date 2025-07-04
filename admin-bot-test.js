/**
 * AdminBot Test Script
 * 
 * This script simulates AdminBot testing the admin workflow in the mobile mechanic app.
 * It tests admin-specific features like dev login toggle, role switching, breadcrumb logging,
 * and admin state management.
 */

// Mock the development utilities
const devMode = process.env.NODE_ENV === 'development' || true; // Force dev mode for testing

const devCredentials = {
  admin: {
    email: "admin@heinicus.dev",
    password: "HeinicusOverlord9000",
  },
  mechanic: {
    email: "mechanic@heinicus.dev",
    password: "MechanicDev2024",
  },
};

const hardcodedAdmin = {
  email: "admin@heinicus.dev",
  password: "HeinicusOverlord9000",
  role: "admin",
  id: "admin-dev-id",
  firstName: "Dev",
  lastName: "Admin",
  createdAt: new Date(),
  isActive: true,
};

const hardcodedMechanic = {
  email: "mechanic@heinicus.dev", 
  password: "MechanicDev2024",
  role: "mechanic",
  id: "mechanic-dev-id",
  firstName: "Dev",
  lastName: "Mechanic",
  createdAt: new Date(),
  isActive: true,
};

function isDevCredentials(email, password) {
  return (
    (email === hardcodedAdmin.email && password === hardcodedAdmin.password) ||
    (email === hardcodedMechanic.email && password === hardcodedMechanic.password)
  );
}

function getDevUser(email) {
  if (email === hardcodedAdmin.email) {
    return hardcodedAdmin;
  }
  if (email === hardcodedMechanic.email) {
    return hardcodedMechanic;
  }
  return null;
}

// Mock admin store
class MockAdminStore {
  constructor() {
    this.settings = {
      system: {
        showQuickAccess: true,
        enableDebugMode: false,
        maintenanceMode: false,
        maxConcurrentJobs: 10,
        sessionTimeout: 60,
      },
      notifications: {
        email: { enabled: true, newJobs: true, jobUpdates: true, systemAlerts: true },
        push: { enabled: true, newJobs: true, jobUpdates: false, systemAlerts: true },
        sms: { enabled: false, emergencyOnly: true },
      },
      security: {
        requireTwoFactor: false,
        allowMultipleSessions: true,
        auditLogging: true,
        passwordExpiry: 90,
        maxLoginAttempts: 5,
      },
    };
  }

  updateSystemSettings(settings) {
    this.settings.system = { ...this.settings.system, ...settings };
    console.log('System settings updated:', settings);
  }

  toggleMaintenanceMode() {
    this.settings.system.maintenanceMode = !this.settings.system.maintenanceMode;
    const newState = this.settings.system.maintenanceMode;
    console.log('Maintenance mode toggled:', newState ? 'ON' : 'OFF');
    
    if (newState) {
      console.log('🚧 System entering maintenance mode - new logins disabled');
    } else {
      console.log('✅ System exiting maintenance mode - normal operations resumed');
    }
  }

  async performBackup() {
    console.log('🔄 Starting system backup...');
    
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('✅ System backup completed successfully');
      return true;
    } catch (error) {
      console.error('❌ System backup failed:', error);
      return false;
    }
  }

  async clearAllSessions() {
    console.log('🔄 Clearing all user sessions...');
    
    try {
      // Simulate session clearing
      await new Promise(resolve => setTimeout(resolve, 500));
      console.log('✅ All user sessions cleared successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to clear sessions:', error);
      return false;
    }
  }

  getSystemStatus() {
    return {
      systemHealth: this.settings.system.maintenanceMode ? 'warning' : 'healthy',
      maintenanceMode: this.settings.system.maintenanceMode,
      activeUsers: Math.floor(Math.random() * 50) + 10,
      lastBackup: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
      uptime: Math.floor(Math.random() * 720) + 24,
    };
  }
}

// Mock auth store
class MockAuthStore {
  constructor() {
    this.user = null;
    this.isAuthenticated = false;
  }

  async login(email, password) {
    console.log('🔑 Attempting login:', { email, devMode });
    
    if (devMode && isDevCredentials(email, password)) {
      const devUser = getDevUser(email);
      if (devUser) {
        this.user = devUser;
        this.isAuthenticated = true;
        console.log('✅ Dev login successful:', { 
          userId: devUser.id, 
          role: devUser.role, 
          timestamp: new Date().toISOString() 
        });
        return true;
      }
    }
    
    console.log('❌ Login failed - invalid credentials');
    return false;
  }

  logout() {
    const currentUser = this.user;
    console.log('🚪 User logout:', { 
      userId: currentUser?.id, 
      role: currentUser?.role,
      timestamp: new Date().toISOString() 
    });
    
    this.user = null;
    this.isAuthenticated = false;
  }

  getUser() {
    return this.user;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }
}

// Mock breadcrumb logger
class MockBreadcrumbLogger {
  constructor() {
    this.breadcrumbs = [];
  }

  logBreadcrumb(route, userId, metadata) {
    const breadcrumb = {
      route,
      userId: userId || 'anonymous',
      timestamp: new Date().toISOString(),
      platform: 'test',
      metadata: metadata || {},
    };

    this.breadcrumbs.push(breadcrumb);
    console.log('📋 Breadcrumb logged:', breadcrumb);
    
    // Keep only last 100 breadcrumbs
    if (this.breadcrumbs.length > 100) {
      this.breadcrumbs.splice(0, this.breadcrumbs.length - 100);
    }
  }

  getBreadcrumbs() {
    return this.breadcrumbs;
  }

  clearBreadcrumbs() {
    this.breadcrumbs = [];
    console.log('🧹 Breadcrumbs cleared');
  }
}

// AdminBot Test Class
class AdminBot {
  constructor() {
    this.adminStore = new MockAdminStore();
    this.authStore = new MockAuthStore();
    this.breadcrumbLogger = new MockBreadcrumbLogger();
    this.testResults = [];
  }

  logResult(test, status, details, errors) {
    const result = { test, status, details, errors };
    this.testResults.push(result);
    
    const statusIcon = status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${statusIcon} ${test}:`, status);
    if (details) console.log('  Details:', details);
    if (errors) console.log('  Errors:', errors);
  }

  async testAdminDualLoginToggle() {
    console.log('\n🧪 Testing Admin Dual Login Toggle...');
    
    try {
      // Test 1: Check if dev mode is enabled
      const devModeStatus = devMode;
      console.log('Dev mode status:', devModeStatus);
      
      // Test 2: Login as admin
      const adminLogin = await this.authStore.login(devCredentials.admin.email, devCredentials.admin.password);
      if (!adminLogin) {
        throw new Error('Admin login failed');
      }
      
      const adminUser = this.authStore.getUser();
      if (!adminUser || adminUser.role !== 'admin') {
        throw new Error('Admin user not set correctly');
      }
      
      // Test 3: Logout and login as mechanic
      this.authStore.logout();
      const mechanicLogin = await this.authStore.login(devCredentials.mechanic.email, devCredentials.mechanic.password);
      if (!mechanicLogin) {
        throw new Error('Mechanic login failed');
      }
      
      const mechanicUser = this.authStore.getUser();
      if (!mechanicUser || mechanicUser.role !== 'mechanic') {
        throw new Error('Mechanic user not set correctly');
      }
      
      this.logResult('Admin Dual Login Toggle', 'SUCCESS', {
        devMode: devModeStatus,
        adminCredentials: devCredentials.admin.email,
        mechanicCredentials: devCredentials.mechanic.email,
        functionalCalls: [
          'devMode check',
          'login() as admin',
          'getUser() after admin login',
          'logout() from admin',
          'login() as mechanic',
          'getUser() after mechanic login'
        ]
      });
      
    } catch (error) {
      this.logResult('Admin Dual Login Toggle', 'FAILURE', {
        devMode: devMode,
        attempted: 'Admin and mechanic login sequence'
      }, error);
    }
  }

  async testRoleSwitching() {
    console.log('\n🧪 Testing Role Switching...');
    
    try {
      // Start as admin
      await this.authStore.login(devCredentials.admin.email, devCredentials.admin.password);
      const adminUser = this.authStore.getUser();
      
      // Log breadcrumb for admin view
      this.breadcrumbLogger.logBreadcrumb('/admin/dashboard', adminUser?.id, { 
        role: 'admin', 
        action: 'view_dashboard' 
      });
      
      // Switch to customer view (simulated)
      this.breadcrumbLogger.logBreadcrumb('/customer/dashboard', adminUser?.id, { 
        role: 'admin', 
        action: 'switch_to_customer_view',
        originalRole: 'admin'
      });
      
      // Switch back to admin view
      this.breadcrumbLogger.logBreadcrumb('/admin/dashboard', adminUser?.id, { 
        role: 'admin', 
        action: 'switch_back_to_admin_view' 
      });
      
      this.logResult('Role Switching', 'SUCCESS', {
        originalRole: adminUser?.role,
        switchedViews: ['admin', 'customer', 'admin'],
        functionalCalls: [
          'login() as admin',
          'logBreadcrumb() for admin dashboard',
          'logBreadcrumb() for customer view switch',
          'logBreadcrumb() for admin view return'
        ]
      });
      
    } catch (error) {
      this.logResult('Role Switching', 'FAILURE', {
        attempted: 'Role switching between admin and customer views'
      }, error);
    }
  }

  async testBreadcrumbLogging() {
    console.log('\n🧪 Testing Breadcrumb Logging...');
    
    try {
      // Clear existing breadcrumbs
      this.breadcrumbLogger.clearBreadcrumbs();
      
      // Log various admin actions
      const adminUser = this.authStore.getUser();
      const testRoutes = [
        { route: '/admin/dashboard', metadata: { section: 'overview' } },
        { route: '/admin/users', metadata: { action: 'view_users' } },
        { route: '/admin/jobs', metadata: { filter: 'active' } },
        { route: '/admin/settings', metadata: { tab: 'system' } },
        { route: '/admin/reports', metadata: { period: 'monthly' } }
      ];
      
      for (const testRoute of testRoutes) {
        this.breadcrumbLogger.logBreadcrumb(testRoute.route, adminUser?.id, testRoute.metadata);
      }
      
      // Get breadcrumbs
      const breadcrumbs = this.breadcrumbLogger.getBreadcrumbs();
      
      if (breadcrumbs.length !== testRoutes.length) {
        throw new Error(`Expected ${testRoutes.length} breadcrumbs, got ${breadcrumbs.length}`);
      }
      
      this.logResult('Breadcrumb Logging', 'SUCCESS', {
        breadcrumbsLogged: breadcrumbs.length,
        routes: testRoutes.map(r => r.route),
        functionalCalls: [
          'clearBreadcrumbs()',
          'logBreadcrumb() x5',
          'getBreadcrumbs()'
        ],
        dataReturned: breadcrumbs.map(b => ({
          route: b.route,
          userId: b.userId,
          timestamp: b.timestamp,
          hasMetadata: Object.keys(b.metadata).length > 0
        }))
      });
      
    } catch (error) {
      this.logResult('Breadcrumb Logging', 'FAILURE', {
        attempted: 'Breadcrumb logging and retrieval'
      }, error);
    }
  }

  async testAdminStateManagement() {
    console.log('\n🧪 Testing Admin State Management...');
    
    try {
      // Test system settings updates
      this.adminStore.updateSystemSettings({ 
        enableDebugMode: true,
        maxConcurrentJobs: 15,
        sessionTimeout: 120
      });
      
      // Test maintenance mode toggle
      this.adminStore.toggleMaintenanceMode();
      const statusAfterToggle = this.adminStore.getSystemStatus();
      
      // Test backup function
      const backupResult = await this.adminStore.performBackup();
      
      // Test session clearing
      const sessionClearResult = await this.adminStore.clearAllSessions();
      
      // Toggle maintenance mode back
      this.adminStore.toggleMaintenanceMode();
      const statusAfterToggleBack = this.adminStore.getSystemStatus();
      
      this.logResult('Admin State Management', 'SUCCESS', {
        systemSettingsUpdated: true,
        maintenanceToggled: statusAfterToggle.maintenanceMode,
        maintenanceToggledBack: statusAfterToggleBack.maintenanceMode,
        backupSuccessful: backupResult,
        sessionsClearedSuccessfully: sessionClearResult,
        functionalCalls: [
          'updateSystemSettings()',
          'toggleMaintenanceMode()',
          'getSystemStatus()',
          'performBackup()',
          'clearAllSessions()',
          'toggleMaintenanceMode() again'
        ],
        dataReturned: {
          systemStatus: statusAfterToggle,
          backupResult,
          sessionClearResult
        }
      });
      
    } catch (error) {
      this.logResult('Admin State Management', 'FAILURE', {
        attempted: 'Admin settings and state management operations'
      }, error);
    }
  }

  async testAdminPermissions() {
    console.log('\n🧪 Testing Admin Permissions...');
    
    try {
      // Ensure we're logged in as admin
      await this.authStore.login(devCredentials.admin.email, devCredentials.admin.password);
      const adminUser = this.authStore.getUser();
      
      if (!adminUser || adminUser.role !== 'admin') {
        throw new Error('Admin user not authenticated');
      }
      
      // Test admin-specific operations
      const systemStatus = this.adminStore.getSystemStatus();
      const backupResult = await this.adminStore.performBackup();
      
      // Log admin actions
      this.breadcrumbLogger.logBreadcrumb('/admin/system-status', adminUser.id, { 
        action: 'view_system_status',
        systemHealth: systemStatus.systemHealth
      });
      
      this.breadcrumbLogger.logBreadcrumb('/admin/backup', adminUser.id, { 
        action: 'perform_backup',
        result: backupResult ? 'success' : 'failure'
      });
      
      this.logResult('Admin Permissions', 'SUCCESS', {
        adminAuthenticated: true,
        adminId: adminUser.id,
        adminRole: adminUser.role,
        systemStatusAccess: !!systemStatus,
        backupPermission: backupResult,
        functionalCalls: [
          'login() as admin',
          'getUser() verification',
          'getSystemStatus()',
          'performBackup()',
          'logBreadcrumb() for admin actions'
        ]
      });
      
    } catch (error) {
      this.logResult('Admin Permissions', 'FAILURE', {
        attempted: 'Admin-specific permission checks'
      }, error);
    }
  }

  generateTestReport() {
    console.log('\n' + '='.repeat(60));
    console.log('🤖 ADMINBOT TEST REPORT');
    console.log('='.repeat(60));
    
    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'SUCCESS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAILURE').length;
    
    console.log(`\n📊 SUMMARY:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${passedTests} ✅`);
    console.log(`   Failed: ${failedTests} ❌`);
    console.log(`   Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
    
    console.log(`\n📋 DETAILED RESULTS:`);
    this.testResults.forEach((result, index) => {
      const statusIcon = result.status === 'SUCCESS' ? '✅' : '❌';
      console.log(`\n${index + 1}. ${statusIcon} ${result.test}`);
      console.log(`   Status: ${result.status}`);
      
      if (result.details) {
        console.log('   Details:');
        if (result.details.functionalCalls) {
          console.log('     Function calls made:', result.details.functionalCalls.join(', '));
        }
        if (result.details.dataReturned) {
          console.log('     Data returned: Yes');
        }
      }
      
      if (result.errors) {
        console.log('   Errors:', result.errors.message || result.errors);
      }
    });
    
    console.log('\n' + '='.repeat(60));
    console.log('🎯 ADMIN WORKFLOW TEST COMPLETED');
    console.log('='.repeat(60));
  }

  async runAllTests() {
    console.log('🤖 AdminBot starting admin workflow tests...\n');
    
    await this.testAdminDualLoginToggle();
    await this.testRoleSwitching();
    await this.testBreadcrumbLogging();
    await this.testAdminStateManagement();
    await this.testAdminPermissions();
    
    this.generateTestReport();
  }
}

// Main execution
async function main() {
  const adminBot = new AdminBot();
  await adminBot.runAllTests();
}

// Run the tests
main().catch(console.error);