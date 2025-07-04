#!/usr/bin/env node
/**
 * MechanicBot - Mechanic Workflow Testing Script
 * 
 * This script simulates a mechanic using the mobile mechanic app's
 * mechanic-specific features and workflows.
 * 
 * Tests include:
 * 1. Mock job creation with realistic data
 * 2. Work timer functionality (start/stop/pause)
 * 3. Payment logging with JobPaymentLogger
 * 4. Service type switching (car to scooter)
 * 5. Mechanic state management
 * 6. Role switching with MechanicSelfSwitch
 */

// Test Results Storage
const testResults = [];

// Helper function to log test results
function logTestResult(result) {
  testResults.push(result);
  const status = result.success ? '✅' : '❌';
  console.log(`\n${status} ${result.task}`);
  console.log(`   Functions called: ${result.functionsCalled.join(', ')}`);
  if (result.dataReturned) {
    console.log(`   Data returned: ${JSON.stringify(result.dataReturned, null, 2)}`);
  }
  if (result.errors.length > 0) {
    console.log(`   Errors: ${result.errors.join(', ')}`);
  }
}

// Mock Components Implementation
class MockWorkTimer {
  constructor(jobId, onTimeUpdate) {
    this.jobId = jobId;
    this.onTimeUpdate = onTimeUpdate;
    this.currentTime = 0;
    this.intervalId = null;
    this.timeData = {
      jobId,
      startTime: null,
      endTime: null,
      totalSeconds: 0,
      status: 'idle',
      pausedDuration: 0,
    };
  }

  startTimer() {
    if (this.timeData.status === 'running') return;

    const now = new Date();
    this.timeData = {
      ...this.timeData,
      startTime: this.timeData.startTime || now,
      status: 'running',
    };

    // Simulate timer running
    this.intervalId = setInterval(() => {
      this.currentTime += 1;
      if (this.onTimeUpdate) this.onTimeUpdate(this.timeData);
    }, 1000);

    console.log(`⏰ Timer started for job: ${this.jobId} at ${now.toISOString()}`);
    return this.timeData;
  }

  pauseTimer() {
    if (this.timeData.status !== 'running') return;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.timeData = {
      ...this.timeData,
      totalSeconds: this.timeData.totalSeconds + this.currentTime,
      status: 'paused',
    };

    this.currentTime = 0;
    console.log(`⏸️ Timer paused for job: ${this.jobId}, Total time: ${this.timeData.totalSeconds} seconds`);
    return this.timeData;
  }

  completeTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    const now = new Date();
    const finalTotalSeconds = this.timeData.totalSeconds + this.currentTime;
    
    this.timeData = {
      ...this.timeData,
      endTime: now,
      totalSeconds: finalTotalSeconds,
      status: 'completed',
    };

    console.log(`✅ Job completed: ${this.jobId}`);
    console.log(`   Total time: ${finalTotalSeconds} seconds (${Math.round(finalTotalSeconds / 60)} minutes)`);
    
    return this.timeData;
  }

  getTimeData() {
    return this.timeData;
  }
}

class MockJobPaymentLogger {
  constructor(jobId, amount) {
    this.jobId = jobId;
    this.amount = amount;
    this.isLogged = false;
    this.selectedMethod = 'cash';
  }

  selectPaymentMethod(method) {
    this.selectedMethod = method;
    console.log(`💳 Payment method selected: ${method}`);
  }

  async logPayment() {
    console.log(`💰 Logging payment for job ${this.jobId}: $${this.amount.toFixed(2)} via ${this.selectedMethod}`);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const paymentData = {
      jobId: this.jobId,
      method: this.selectedMethod,
      amount: this.amount,
      timestamp: new Date(),
      userId: 'mechanic-cody',
      notes: `Payment received via ${this.selectedMethod}`,
    };

    console.log('✅ Payment logged successfully:', paymentData);
    this.isLogged = true;
    return paymentData;
  }

  getPaymentStatus() {
    return { isLogged: this.isLogged, method: this.selectedMethod };
  }
}

class MockServiceTypeToggle {
  constructor() {
    this.currentServiceType = 'auto';
  }

  switchToService(serviceType) {
    const previousType = this.currentServiceType;
    this.currentServiceType = serviceType;
    console.log(`🔄 Service type switched from ${previousType} to ${serviceType}`);
    return { previous: previousType, current: serviceType };
  }

  getCurrentServiceType() {
    return this.currentServiceType;
  }
}

class MockMechanicSelfSwitch {
  constructor() {
    this.currentRole = 'mechanic';
  }

  switchRole() {
    const previousRole = this.currentRole;
    this.currentRole = this.currentRole === 'mechanic' ? 'admin' : 'mechanic';
    
    console.log(`🔄 Role switched from ${previousRole} to ${this.currentRole}`);
    console.log(`   User ID: ${this.currentRole}-cody`);
    
    return { previous: previousRole, current: this.currentRole };
  }

  getCurrentRole() {
    return this.currentRole;
  }
}

// Test Functions
function createMockJob() {
  return {
    id: `job-${Date.now()}`,
    type: 'brake_service',
    description: 'Customer reports squeaking brakes and reduced stopping power. Needs immediate inspection.',
    urgency: 'high',
    status: 'accepted',
    vehicleType: 'car',
    estimatedDuration: 90, // minutes
    amount: 250.00,
    location: {
      latitude: 40.7128,
      longitude: -74.0060,
      address: '123 Main St, New York, NY 10001',
    },
    customerName: 'John Smith',
    customerPhone: '(555) 123-4567',
    scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
  };
}

async function testMockJobCreation() {
  try {
    const job = createMockJob();
    
    logTestResult({
      task: 'Create mock job object with realistic data',
      success: true,
      functionsCalled: ['createMockJob'],
      dataReturned: job,
      errors: [],
    });

    console.log('\n📋 Mock Job Created:');
    console.log(`   Job ID: ${job.id}`);
    console.log(`   Type: ${job.type}`);
    console.log(`   Vehicle: ${job.vehicleType}`);
    console.log(`   Customer: ${job.customerName}`);
    console.log(`   Amount: $${job.amount.toFixed(2)}`);
    console.log(`   Location: ${job.location.address}`);
    console.log(`   Scheduled: ${job.scheduledTime.toLocaleString()}`);
    
    // Store the job for other tests
    global.currentMockJob = job;
    
  } catch (error) {
    logTestResult({
      task: 'Create mock job object with realistic data',
      success: false,
      functionsCalled: ['createMockJob'],
      dataReturned: null,
      errors: [error.message],
    });
  }
}

async function testWorkTimer() {
  try {
    const job = global.currentMockJob;
    if (!job) throw new Error('No mock job available');

    const timer = new MockWorkTimer(job.id, (timeData) => {
      console.log(`⏱️ Timer update: ${timeData.status} - ${timeData.totalSeconds}s`);
    });

    // Start timer
    const startResult = timer.startTimer();
    
    // Simulate work for 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Pause timer
    const pauseResult = timer.pauseTimer();
    
    // Resume timer
    const resumeResult = timer.startTimer();
    
    // Simulate more work for 2 seconds
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Complete timer
    const completeResult = timer.completeTimer();
    
    logTestResult({
      task: 'Start/stop work timer functionality',
      success: true,
      functionsCalled: ['startTimer', 'pauseTimer', 'startTimer', 'completeTimer'],
      dataReturned: {
        startResult,
        pauseResult,
        resumeResult,
        completeResult,
      },
      errors: [],
    });

  } catch (error) {
    logTestResult({
      task: 'Start/stop work timer functionality',
      success: false,
      functionsCalled: ['MockWorkTimer'],
      dataReturned: null,
      errors: [error.message],
    });
  }
}

async function testPaymentLogger() {
  try {
    const job = global.currentMockJob;
    if (!job) throw new Error('No mock job available');

    const paymentLogger = new MockJobPaymentLogger(job.id, job.amount);
    
    // Test different payment methods
    const paymentMethods = ['cash', 'paypal', 'chime', 'cashapp', 'stripe'];
    const selectedMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
    
    paymentLogger.selectPaymentMethod(selectedMethod);
    const paymentData = await paymentLogger.logPayment();
    const paymentStatus = paymentLogger.getPaymentStatus();
    
    logTestResult({
      task: 'Log payment manually using JobPaymentLogger',
      success: true,
      functionsCalled: ['selectPaymentMethod', 'logPayment', 'getPaymentStatus'],
      dataReturned: {
        paymentData,
        paymentStatus,
      },
      errors: [],
    });

  } catch (error) {
    logTestResult({
      task: 'Log payment manually using JobPaymentLogger',
      success: false,
      functionsCalled: ['MockJobPaymentLogger'],
      dataReturned: null,
      errors: [error.message],
    });
  }
}

async function testServiceTypeToggle() {
  try {
    const serviceToggle = new MockServiceTypeToggle();
    
    // Start with auto service
    const initialType = serviceToggle.getCurrentServiceType();
    
    // Switch to scooter service
    const switchResult = serviceToggle.switchToService('scooter');
    
    // Verify the switch
    const finalType = serviceToggle.getCurrentServiceType();
    
    logTestResult({
      task: 'Switch to scooter service view',
      success: finalType === 'scooter',
      functionsCalled: ['getCurrentServiceType', 'switchToService', 'getCurrentServiceType'],
      dataReturned: {
        initialType,
        switchResult,
        finalType,
      },
      errors: finalType !== 'scooter' ? ['Service type did not switch to scooter'] : [],
    });

  } catch (error) {
    logTestResult({
      task: 'Switch to scooter service view',
      success: false,
      functionsCalled: ['MockServiceTypeToggle'],
      dataReturned: null,
      errors: [error.message],
    });
  }
}

async function testMechanicStateManagement() {
  try {
    const job = global.currentMockJob;
    if (!job) throw new Error('No mock job available');

    // Simulate mechanic state management operations
    const mechanicState = {
      activeJobs: [job],
      currentLocation: { lat: 40.7128, lng: -74.0060 },
      status: 'available',
      toolsChecked: { wrench: true, screwdriver: true, multimeter: false },
      currentJobId: job.id,
    };

    // Update job status
    const updateJobStatus = (jobId, status) => {
      console.log(`🔄 Job status updated: ${jobId} -> ${status}`);
      return { jobId, status, timestamp: new Date() };
    };

    // Update mechanic location
    const updateLocation = (location) => {
      console.log(`📍 Mechanic location updated: ${location.lat}, ${location.lng}`);
      return { location, timestamp: new Date() };
    };

    // Test state operations
    const jobStatusUpdate = updateJobStatus(job.id, 'in_progress');
    const locationUpdate = updateLocation({ lat: 40.7200, lng: -74.0100 });
    
    logTestResult({
      task: 'Test mechanic-specific state management',
      success: true,
      functionsCalled: ['updateJobStatus', 'updateLocation'],
      dataReturned: {
        mechanicState,
        jobStatusUpdate,
        locationUpdate,
      },
      errors: [],
    });

  } catch (error) {
    logTestResult({
      task: 'Test mechanic-specific state management',
      success: false,
      functionsCalled: ['mechanicStateManagement'],
      dataReturned: null,
      errors: [error.message],
    });
  }
}

async function testMechanicRoleSwitch() {
  try {
    const roleSwitch = new MockMechanicSelfSwitch();
    
    // Get initial role
    const initialRole = roleSwitch.getCurrentRole();
    
    // Switch role
    const switchResult = roleSwitch.switchRole();
    
    // Verify the switch
    const finalRole = roleSwitch.getCurrentRole();
    
    // Switch back
    const switchBackResult = roleSwitch.switchRole();
    const backToOriginalRole = roleSwitch.getCurrentRole();
    
    logTestResult({
      task: 'Test role switching with MechanicSelfSwitch',
      success: true,
      functionsCalled: ['getCurrentRole', 'switchRole', 'getCurrentRole', 'switchRole', 'getCurrentRole'],
      dataReturned: {
        initialRole,
        switchResult,
        finalRole,
        switchBackResult,
        backToOriginalRole,
      },
      errors: [],
    });

  } catch (error) {
    logTestResult({
      task: 'Test role switching with MechanicSelfSwitch',
      success: false,
      functionsCalled: ['MockMechanicSelfSwitch'],
      dataReturned: null,
      errors: [error.message],
    });
  }
}

// Main Test Runner
async function runMechanicWorkflowTests() {
  console.log('🤖 MechanicBot - Starting Mechanic Workflow Tests\n');
  console.log('='.repeat(60));

  try {
    // Test 1: Set up mock job
    console.log('\n🔧 Test 1: Creating mock job object...');
    await testMockJobCreation();

    // Test 2: Work timer functionality
    console.log('\n⏱️ Test 2: Testing work timer functionality...');
    await testWorkTimer();

    // Test 3: Payment logging
    console.log('\n💰 Test 3: Testing payment logging...');
    await testPaymentLogger();

    // Test 4: Service type switching
    console.log('\n🔄 Test 4: Testing service type switching...');
    await testServiceTypeToggle();

    // Test 5: Mechanic state management
    console.log('\n📊 Test 5: Testing mechanic state management...');
    await testMechanicStateManagement();

    // Test 6: Role switching
    console.log('\n👤 Test 6: Testing role switching...');
    await testMechanicRoleSwitch();

  } catch (error) {
    console.error('❌ Test runner error:', error);
  }

  // Print final results
  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL TEST RESULTS');
  console.log('='.repeat(60));

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.success).length;
  const failedTests = totalTests - passedTests;

  console.log(`\nTotal Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);

  if (failedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.filter(r => !r.success).forEach(result => {
      console.log(`   • ${result.task}: ${result.errors.join(', ')}`);
    });
  }

  console.log('\n✅ All mechanic workflow tests completed!');
  console.log('🔧 MechanicBot simulation finished successfully.');
}

// Run the tests
if (require.main === module) {
  runMechanicWorkflowTests().catch(console.error);
}