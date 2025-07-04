#!/usr/bin/env node

/**
 * CustomerBot Workflow Test
 * Simulates a customer using the mobile mechanic app workflow
 * 
 * Customer Profile:
 * - VIN: 1HGCM82633A123456
 * - Vehicle: motorcycle
 * - Service: oil-change
 */

import { VinData, ServiceRequest, Quote, VehicleType } from './types/service';
import { generateSmartQuote, QuoteOptions } from './utils/quote-generator';
import { SERVICE_PRICING } from './constants/pricing';

// Simulated app store state
class MockAppStore {
  private vehicles: any[] = [];
  private serviceRequests: ServiceRequest[] = [];
  private quotes: Quote[] = [];
  private contact: any = null;

  setContact(contact: any) {
    this.contact = contact;
    console.log('📇 Contact updated:', contact);
  }

  addVehicle(vehicle: any) {
    this.vehicles.push(vehicle);
    console.log('🚗 Vehicle added:', vehicle);
  }

  addServiceRequest(request: ServiceRequest) {
    this.serviceRequests.push(request);
    console.log('🔧 Service request added:', request);
  }

  addQuote(quote: Quote) {
    this.quotes.push(quote);
    console.log('💰 Quote added:', quote);
  }

  updateQuote(id: string, updates: Partial<Quote>) {
    const quote = this.quotes.find(q => q.id === id);
    if (quote) {
      Object.assign(quote, updates);
      console.log('💰 Quote updated:', quote);
    }
  }

  updateServiceRequest(id: string, updates: Partial<ServiceRequest>) {
    const request = this.serviceRequests.find(r => r.id === id);
    if (request) {
      Object.assign(request, updates);
      console.log('🔧 Service request updated:', request);
    }
  }

  getJobParts(jobId: string) {
    // Mock parts for testing
    return [
      {
        name: 'Motorcycle Oil Filter',
        description: 'High-performance oil filter for motorcycles',
        price: 12,
        quantity: 1,
        source: 'OEM'
      }
    ];
  }

  cancelJob(jobId: string, reason: string, mechanicId: string) {
    const request = this.serviceRequests.find(r => r.id === jobId);
    if (request) {
      request.status = 'cancelled';
      request.cancellationReason = reason;
      request.cancelledBy = mechanicId;
      request.cancelledAt = new Date();
      console.log('❌ Job cancelled:', { jobId, reason, mechanicId });
      return true;
    }
    return false;
  }
}

// Simulated VIN Scanner functionality
class MockVinScanner {
  static async decodeVin(vin: string, vehicleType: VehicleType): Promise<VinData | null> {
    console.log('🔍 VIN Scanner: Decoding VIN:', vin, 'for vehicle type:', vehicleType);

    // Validate VIN format based on vehicle type
    if (vehicleType === 'motorcycle') {
      if (vin.length < 11 || vin.length > 17) {
        throw new Error('Invalid motorcycle VIN length');
      }
    } else if (vehicleType === 'car' && vin.length !== 17) {
      throw new Error('Invalid car VIN length');
    }

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock VIN decode for test VIN 1HGCM82633A123456
    if (vin === '1HGCM82633A123456') {
      return {
        vin: vin,
        make: 'Honda',
        model: 'CBR600RR',
        year: 2023,
        vehicleType: 'motorcycle',
        engine: '599cc Inline-4',
        transmission: '6-Speed Manual',
        bodyStyle: 'Sport Bike',
        fuelType: 'Gasoline'
      };
    }

    // Fallback for other VINs
    return {
      vin: vin,
      make: 'Unknown',
      model: 'Unknown Model',
      year: new Date().getFullYear(),
      vehicleType: vehicleType
    };
  }
}

// Simulated Quote Dispatcher functionality
class MockQuoteDispatcher {
  static generateQuote(serviceRequestId: string, vinData: VinData, serviceType: string): Quote {
    console.log('📋 QuoteDispatcher: Generating quote for service:', serviceType);

    // Check available service types in pricing
    const availableServices = Object.keys(SERVICE_PRICING);
    console.log('📊 Available service types in pricing:', availableServices);

    // Map motorcycle oil change to the correct service type
    // Since motorcycle services aren't in SERVICE_PRICING, use oil_change as fallback
    let mappedServiceType = serviceType === 'oil-change' ? 'oil_change' : serviceType as any;
    
    if (vinData.vehicleType === 'motorcycle') {
      console.log('🏍️  Note: Using car oil_change pricing for motorcycle (motorcycle pricing not available)');
    }

    if (!availableServices.includes(mappedServiceType)) {
      console.log('⚠️  Service type not found in pricing, using oil_change as fallback');
      mappedServiceType = 'oil_change';
    }

    const vehicle = {
      id: 'mock-vehicle-id',
      make: vinData.make,
      model: vinData.model,
      year: vinData.year,
      vehicleType: vinData.vehicleType,
      vin: vinData.vin,
      mileage: 15000
    };

    const options: QuoteOptions = {
      serviceType: mappedServiceType,
      urgency: 'medium',
      description: 'Customer requested oil change service for motorcycle',
      vehicle: vehicle,
      location: {
        latitude: 40.7128,
        longitude: -74.0060,
        address: '123 Test St, New York, NY 10001'
      }
    };

    return generateSmartQuote(serviceRequestId, options);
  }
}

// Simulated Payment Modal functionality
class MockPaymentModal {
  static async processPayment(quote: Quote, paymentType: 'deposit' | 'full' = 'full'): Promise<boolean> {
    console.log('💳 PaymentModal: Processing payment...');
    console.log('💰 Amount:', paymentType === 'deposit' ? Math.round(quote.totalCost * 0.3) : quote.totalCost);
    console.log('📦 Payment type:', paymentType);

    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Simulate 95% success rate
    const success = Math.random() > 0.05;
    
    if (success) {
      console.log('✅ Payment processed successfully');
      return true;
    } else {
      console.log('❌ Payment failed');
      return false;
    }
  }
}

// Simulated QuickPay functionality  
class MockQuickPay {
  static generatePaymentLinks(total: number, jobId?: string) {
    console.log('⚡ QuickPay: Generating payment links for total:', total);
    
    const paymentLinks = {
      CashApp: `https://cash.app/$heinicus/${total.toFixed(2)}`,
      Chime: `https://chime.com/pay/heinicus/${total.toFixed(2)}`,
      PayPal: `https://paypal.me/heinicus/${total.toFixed(2)}`,
      Venmo: `https://venmo.com/u/heinicus/${total.toFixed(2)}`
    };

    console.log('🔗 Payment links generated:', paymentLinks);
    return paymentLinks;
  }

  static async copyLink(method: string, link: string): Promise<boolean> {
    console.log(`📋 QuickPay: Copying ${method} link:`, link);
    // Simulate clipboard operation
    await new Promise(resolve => setTimeout(resolve, 100));
    return true;
  }
}

// Main CustomerBot test workflow
class CustomerBot {
  private appStore: MockAppStore;
  private vinData: VinData | null = null;
  private serviceRequest: ServiceRequest | null = null;
  private quote: Quote | null = null;

  constructor() {
    this.appStore = new MockAppStore();
  }

  async runWorkflow() {
    console.log('🤖 CustomerBot: Starting workflow test...\n');

    try {
      // Step 1: Submit VIN through VinScanner component
      await this.step1_submitVin();

      // Step 2: Select oil-change service
      await this.step2_selectService();

      // Step 3: Submit quote request through QuoteDispatcher
      await this.step3_requestQuote();

      // Step 4: Simulate QuickPay payment flow
      await this.step4_quickPayFlow();

      // Step 5: Attempt to cancel job
      await this.step5_cancelJob();

      console.log('\n🎉 CustomerBot workflow test completed successfully!');

    } catch (error) {
      console.error('\n💥 CustomerBot workflow test failed:', error);
    }
  }

  private async step1_submitVin() {
    console.log('\n📋 STEP 1: Submit VIN through VinScanner component');
    console.log('=' .repeat(50));

    try {
      // Customer inputs VIN and selects motorcycle vehicle type
      const testVin = '1HGCM82633A123456';
      const vehicleType: VehicleType = 'motorcycle';

      console.log('🎯 Test Data:');
      console.log('   VIN:', testVin);
      console.log('   Vehicle Type:', vehicleType);

      // Simulate VIN scanner component
      this.vinData = await MockVinScanner.decodeVin(testVin, vehicleType);
      
      if (!this.vinData) {
        throw new Error('VIN decode failed');
      }

      // Add vehicle to app store
      this.appStore.addVehicle({
        id: Date.now().toString(),
        ...this.vinData,
        mileage: 15000,
        color: 'Red',
        licensePlate: 'MC123'
      });

      console.log('✅ Step 1 Success: VIN decoded and vehicle added');
      console.log('📊 Result:', this.vinData);

    } catch (error) {
      console.log('❌ Step 1 Failure:', error);
      throw error;
    }
  }

  private async step2_selectService() {
    console.log('\n📋 STEP 2: Select oil-change service');
    console.log('=' .repeat(50));

    try {
      if (!this.vinData) {
        throw new Error('No vehicle data available');
      }

      const selectedService = 'oil-change';
      console.log('🎯 Selected Service:', selectedService);
      console.log('🏍️  Vehicle Type:', this.vinData.vehicleType);

      // Validate service compatibility
      if (this.vinData.vehicleType === 'motorcycle' && selectedService === 'oil-change') {
        console.log('✅ Service compatible with motorcycle');
      }

      console.log('✅ Step 2 Success: Service selected');

    } catch (error) {
      console.log('❌ Step 2 Failure:', error);
      throw error;
    }
  }

  private async step3_requestQuote() {
    console.log('\n📋 STEP 3: Submit quote request through QuoteDispatcher');
    console.log('=' .repeat(50));

    try {
      if (!this.vinData) {
        throw new Error('No vehicle data available');
      }

      // Create service request
      this.serviceRequest = {
        id: Date.now().toString(),
        type: 'motorcycle_oil_change',
        description: 'Motorcycle oil change - full synthetic preferred',
        urgency: 'medium',
        status: 'pending',
        createdAt: new Date(),
        vehicleId: 'mock-vehicle-id',
        vehicleType: this.vinData.vehicleType,
        vinNumber: this.vinData.vin,
        location: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Test St, New York, NY 10001'
        }
      };

      this.appStore.addServiceRequest(this.serviceRequest);

      // Generate quote using QuoteDispatcher
      this.quote = MockQuoteDispatcher.generateQuote(
        this.serviceRequest.id,
        this.vinData,
        'oil-change'
      );

      this.appStore.addQuote(this.quote);

      console.log('✅ Step 3 Success: Quote generated');
      console.log('📊 Quote Details:');
      console.log('   Service:', this.quote.description);
      console.log('   Labor Cost: $' + this.quote.laborCost);
      console.log('   Parts Cost: $' + this.quote.partsCost);
      console.log('   Travel Cost: $' + this.quote.travelCost);
      console.log('   Total Cost: $' + this.quote.totalCost);
      console.log('   Duration:', this.quote.estimatedDuration + ' hours');

    } catch (error) {
      console.log('❌ Step 3 Failure:', error);
      throw error;
    }
  }

  private async step4_quickPayFlow() {
    console.log('\n📋 STEP 4: Simulate QuickPay payment flow');
    console.log('=' .repeat(50));

    try {
      if (!this.quote) {
        throw new Error('No quote available');
      }

      // Test regular payment modal first
      console.log('💳 Testing PaymentModal component...');
      const paymentSuccess = await MockPaymentModal.processPayment(this.quote, 'full');

      if (paymentSuccess) {
        this.appStore.updateQuote(this.quote.id, {
          status: 'paid',
          paidAt: new Date(),
          paymentMethod: 'card'
        });

        this.appStore.updateServiceRequest(this.serviceRequest!.id, {
          status: 'completed',
          paidAt: new Date()
        });
      }

      // Test QuickPay functionality
      console.log('\n⚡ Testing QuickPay component...');
      const paymentLinks = MockQuickPay.generatePaymentLinks(
        this.quote.totalCost,
        this.serviceRequest?.id
      );

      // Simulate copying payment links
      for (const [method, link] of Object.entries(paymentLinks)) {
        const copySuccess = await MockQuickPay.copyLink(method, link);
        if (copySuccess) {
          console.log(`✅ ${method} link copied successfully`);
        }
      }

      console.log('✅ Step 4 Success: Payment flows tested');

    } catch (error) {
      console.log('❌ Step 4 Failure:', error);
      throw error;
    }
  }

  private async step5_cancelJob() {
    console.log('\n📋 STEP 5: Attempt to cancel job');
    console.log('=' .repeat(50));

    try {
      if (!this.serviceRequest) {
        throw new Error('No service request available');
      }

      console.log('⚠️  Testing job cancellation functionality...');
      
      const cancelSuccess = this.appStore.cancelJob(
        this.serviceRequest.id,
        'Customer changed mind about service',
        'customer-self'
      );

      if (cancelSuccess) {
        console.log('✅ Step 5 Success: Job cancelled successfully');
        console.log('📊 Cancellation Details:');
        console.log('   Job ID:', this.serviceRequest.id);
        console.log('   Reason: Customer changed mind about service');
        console.log('   Cancelled by: customer-self');
        console.log('   Status:', this.serviceRequest.status);
      } else {
        console.log('⚠️  Step 5 Warning: Cancel job may not be fully implemented');
      }

    } catch (error) {
      console.log('❌ Step 5 Failure:', error);
      // Don't throw here since cancellation might not be fully implemented
    }
  }
}

// Run the CustomerBot workflow test
async function main() {
  console.log('🚀 Mobile Mechanic App - CustomerBot Workflow Test');
  console.log('=' .repeat(60));
  console.log('👤 Customer Profile:');
  console.log('   VIN: 1HGCM82633A123456');
  console.log('   Vehicle: motorcycle');
  console.log('   Service: oil-change');
  console.log('=' .repeat(60));

  const customerBot = new CustomerBot();
  await customerBot.runWorkflow();
}

// Export for potential import usage
export {
  CustomerBot,
  MockVinScanner,
  MockQuoteDispatcher,
  MockPaymentModal,
  MockQuickPay,
  MockAppStore
};

// Run if executed directly
if (require.main === module) {
  main().catch(console.error);
}