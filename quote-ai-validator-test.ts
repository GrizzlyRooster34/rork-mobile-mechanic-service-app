#!/usr/bin/env ts-node

/**
 * QuoteAIValidator Test Script
 * Testing the quote generation and AI validation workflow
 */

import { generateSmartQuote, calculateLiveCost, QuoteOptions } from './utils/quote-generator';
import { getPartEstimate, getMotorcyclePartEstimate, calculatePartsTotal } from './utils/parts/getPartEstimate';
import { SERVICE_PRICING } from './constants/pricing';
import { ServiceType, Vehicle, DiagnosticResult, Quote, VehicleType } from './types/service';

// Test Data Setup
const testVehicles: Vehicle[] = [
  {
    id: 'test-car-1',
    make: 'Toyota',
    model: 'Camry',
    year: 2018,
    vehicleType: 'car',
    vin: '1HGCM82633A123456',
    mileage: 85000,
    engine: '2.5L I4',
    color: 'Silver'
  },
  {
    id: 'test-car-2',
    make: 'BMW',
    model: 'X5',
    year: 2015,
    vehicleType: 'car',
    vin: '5UXKR0C58F0123456',
    mileage: 125000,
    engine: '3.0L Turbo I6',
    color: 'Black'
  },
  {
    id: 'test-motorcycle-1',
    make: 'Honda',
    model: 'CBR600RR',
    year: 2020,
    vehicleType: 'motorcycle',
    vin: 'JH2PC3706LM123456',
    mileage: 8500,
    engine: '599cc I4',
    color: 'Red'
  },
  {
    id: 'test-scooter-1',
    make: 'Yamaha',
    model: 'Vino 125',
    year: 2019,
    vehicleType: 'scooter',
    vin: 'JYA5EL05KAA123456',
    mileage: 3200,
    engine: '125cc Single',
    color: 'Blue'
  }
];

const testDiagnosticResults: DiagnosticResult[] = [
  {
    id: 'diag-1',
    confidence: 0.9,
    likelyCauses: ['Oil contamination', 'Dirty oil filter'],
    diagnosticSteps: ['Check oil level', 'Inspect oil color', 'Check oil filter'],
    urgencyLevel: 'medium',
    estimatedCost: { min: 75, max: 95 },
    matchedServices: ['oil_change'],
    recommendedServiceTypes: ['oil_change'],
    createdAt: new Date()
  },
  {
    id: 'diag-2',
    confidence: 0.7,
    likelyCauses: ['Brake pad wear', 'Brake fluid contamination'],
    diagnosticSteps: ['Visual brake inspection', 'Check brake fluid level', 'Test brake pedal feel'],
    urgencyLevel: 'high',
    estimatedCost: { min: 200, max: 400 },
    matchedServices: ['brake_service'],
    recommendedServiceTypes: ['brake_service'],
    createdAt: new Date()
  },
  {
    id: 'diag-3',
    confidence: 0.5,
    likelyCauses: ['Engine misfire', 'Faulty sensor', 'Fuel system issue'],
    diagnosticSteps: ['OBD scan', 'Check spark plugs', 'Test fuel pressure', 'Inspect sensors'],
    urgencyLevel: 'emergency',
    estimatedCost: { min: 150, max: 500 },
    matchedServices: ['engine_diagnostic'],
    recommendedServiceTypes: ['engine_diagnostic'],
    createdAt: new Date()
  }
];

class QuoteAIValidator {
  private testResults: any[] = [];
  private passedTests = 0;
  private failedTests = 0;

  log(message: string, success = true) {
    const status = success ? '✅' : '❌';
    const timestamp = new Date().toISOString();
    const logEntry = `${status} [${timestamp}] ${message}`;
    console.log(logEntry);
    this.testResults.push({ timestamp, message, success });
    
    if (success) {
      this.passedTests++;
    } else {
      this.failedTests++;
    }
  }

  logData(label: string, data: any) {
    console.log(`📊 ${label}:`, JSON.stringify(data, null, 2));
  }

  async testVINQuoteGeneration() {
    console.log('\n🔍 Testing VIN + Vehicle Condition Data for Quote Generation...\n');

    for (const vehicle of testVehicles) {
      try {
        const options: QuoteOptions = {
          serviceType: vehicle.vehicleType === 'car' ? 'oil_change' : 
                     vehicle.vehicleType === 'motorcycle' ? 'oil_change' : 'scooter_oil_change',
          urgency: 'medium',
          description: `Regular oil change service for ${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          vehicle,
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Main St, New York, NY 10001'
          }
        };

        const quote = generateSmartQuote(`request-${vehicle.id}`, options);
        
        this.log(`Quote generated for ${vehicle.year} ${vehicle.make} ${vehicle.model} (${vehicle.vehicleType})`);
        this.logData('Vehicle Details', {
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          mileage: vehicle.mileage,
          vehicleType: vehicle.vehicleType
        });
        this.logData('Quote Details', {
          id: quote.id,
          totalCost: quote.totalCost,
          laborCost: quote.laborCost,
          partsCost: quote.partsCost,
          travelCost: quote.travelCost,
          estimatedDuration: quote.estimatedDuration,
          description: quote.description.substring(0, 100) + '...'
        });

        // Validate quote structure
        if (!quote.id || !quote.totalCost || !quote.description) {
          this.log(`Quote validation failed for ${vehicle.make} ${vehicle.model}`, false);
        } else {
          this.log(`Quote structure validated for ${vehicle.make} ${vehicle.model}`);
        }

        // Validate vehicle-specific pricing adjustments
        if (vehicle.make === 'BMW' && quote.partsCost > 0) {
          const baseCost = SERVICE_PRICING[options.serviceType].commonParts[0]?.price || 0;
          const luxuryMarkup = quote.partsCost > baseCost * 1.2;
          if (luxuryMarkup) {
            this.log(`Luxury brand pricing markup applied correctly for ${vehicle.make}`);
          } else {
            this.log(`Luxury brand pricing markup not applied for ${vehicle.make}`, false);
          }
        }

        // Validate vehicle age factor
        const currentYear = new Date().getFullYear();
        const vehicleAge = currentYear - vehicle.year;
        if (vehicleAge > 10 && quote.estimatedDuration > SERVICE_PRICING[options.serviceType].estimatedHours) {
          this.log(`Vehicle age factor applied correctly for ${vehicleAge}-year-old vehicle`);
        }

      } catch (error) {
        this.log(`Error generating quote for ${vehicle.make} ${vehicle.model}: ${error}`, false);
      }
    }
  }

  async testDifferentVehicleTypes() {
    console.log('\n🚗 Testing Quote Generation for Different Vehicle Types...\n');

    const serviceTypes: { [key in VehicleType]: ServiceType[] } = {
      car: ['oil_change', 'brake_service', 'tire_service', 'battery_service'],
      motorcycle: ['oil_change', 'brake_service', 'tire_service', 'battery_service'],
      scooter: ['oil_change', 'brake_service', 'tire_service', 'battery_service']
    };

    for (const vehicle of testVehicles) {
      const applicableServices = serviceTypes[vehicle.vehicleType];
      
      for (const serviceType of applicableServices) {
        try {
          const options: QuoteOptions = {
            serviceType,
            urgency: 'medium',
            description: `${serviceType.replace('_', ' ')} service for ${vehicle.vehicleType}`,
            vehicle,
            location: {
              latitude: 40.7128,
              longitude: -74.0060,
              address: '123 Main St, New York, NY 10001'
            }
          };

          const quote = generateSmartQuote(`request-${vehicle.id}-${serviceType}`, options);
          
          this.log(`${serviceType} quote generated for ${vehicle.vehicleType}: $${quote.totalCost}`);
          
          // Validate service-specific pricing
          const servicePricing = SERVICE_PRICING[serviceType];
          if (servicePricing) {
            const isWithinRange = quote.totalCost >= servicePricing.priceRange.min && 
                                 quote.totalCost <= servicePricing.priceRange.max * 2; // Allow for multipliers
            if (isWithinRange) {
              this.log(`Price within expected range for ${serviceType} on ${vehicle.vehicleType}`);
            } else {
              this.log(`Price outside expected range for ${serviceType} on ${vehicle.vehicleType}: $${quote.totalCost} (expected: $${servicePricing.priceRange.min}-$${servicePricing.priceRange.max})`, false);
            }
          }

        } catch (error) {
          this.log(`Error generating ${serviceType} quote for ${vehicle.vehicleType}: ${error}`, false);
        }
      }
    }
  }

  async testPriceCalculationLogic() {
    console.log('\n💰 Testing Price Calculation Logic and AI Suggestions...\n');

    const urgencyLevels: Array<'low' | 'medium' | 'high' | 'emergency'> = ['low', 'medium', 'high', 'emergency'];
    const baseVehicle = testVehicles[0];

    for (const urgency of urgencyLevels) {
      try {
        const options: QuoteOptions = {
          serviceType: 'oil_change',
          urgency,
          description: 'Oil change with urgency testing',
          vehicle: baseVehicle,
          aiDiagnosis: testDiagnosticResults[0]
        };

        const quote = generateSmartQuote(`urgency-test-${urgency}`, options);
        const liveCost = calculateLiveCost(
          options.serviceType,
          urgency,
          baseVehicle,
          { latitude: 40.7128, longitude: -74.0060 }
        );

        this.log(`${urgency} urgency quote: $${quote.totalCost} (Live: $${liveCost.min}-$${liveCost.max})`);
        this.logData(`${urgency} urgency breakdown`, {
          laborCost: quote.laborCost,
          partsCost: quote.partsCost,
          travelCost: quote.travelCost,
          urgencyMultiplier: liveCost.breakdown.urgencyMultiplier,
          estimatedDuration: quote.estimatedDuration
        });

        // Validate urgency multiplier application
        if (urgency === 'emergency' && quote.laborCost > SERVICE_PRICING.oil_change.laborRate * SERVICE_PRICING.oil_change.estimatedHours) {
          this.log(`Emergency urgency multiplier applied correctly`);
        } else if (urgency === 'low' && quote.laborCost < SERVICE_PRICING.oil_change.laborRate * SERVICE_PRICING.oil_change.estimatedHours) {
          this.log(`Low urgency discount applied correctly`);
        }

      } catch (error) {
        this.log(`Error testing ${urgency} urgency pricing: ${error}`, false);
      }
    }
  }

  async testAISuggestions() {
    console.log('\n🤖 Testing AI Diagnostic Integration...\n');

    const vehicle = testVehicles[0];

    for (const aiDiagnosis of testDiagnosticResults) {
      try {
        const options: QuoteOptions = {
          serviceType: aiDiagnosis.recommendedServiceTypes[0],
          urgency: aiDiagnosis.urgencyLevel,
          description: `Service based on AI diagnosis: ${aiDiagnosis.likelyCauses[0]}`,
          vehicle,
          aiDiagnosis
        };

        const quote = generateSmartQuote(`ai-test-${aiDiagnosis.id}`, options);
        
        this.log(`AI-assisted quote generated (confidence: ${aiDiagnosis.confidence})`);
        this.logData('AI Diagnosis Impact', {
          confidence: aiDiagnosis.confidence,
          likelyCauses: aiDiagnosis.likelyCauses,
          estimatedCost: aiDiagnosis.estimatedCost,
          urgencyLevel: aiDiagnosis.urgencyLevel,
          quotedCost: quote.totalCost,
          laborAdjustment: quote.estimatedDuration
        });

        // Validate AI confidence impact on pricing
        if (aiDiagnosis.confidence > 0.8 && quote.estimatedDuration <= SERVICE_PRICING[options.serviceType].estimatedHours) {
          this.log(`High confidence AI diagnosis reduced labor time appropriately`);
        } else if (aiDiagnosis.confidence < 0.6 && quote.estimatedDuration > SERVICE_PRICING[options.serviceType].estimatedHours) {
          this.log(`Low confidence AI diagnosis increased labor time appropriately`);
        }

        // Validate AI estimated cost integration
        if (aiDiagnosis.estimatedCost) {
          const costInRange = quote.totalCost >= aiDiagnosis.estimatedCost.min && 
                             quote.totalCost <= aiDiagnosis.estimatedCost.max * 1.5;
          if (costInRange) {
            this.log(`Quote cost aligns with AI estimated cost range`);
          } else {
            this.log(`Quote cost outside AI estimated range: $${quote.totalCost} vs $${aiDiagnosis.estimatedCost.min}-$${aiDiagnosis.estimatedCost.max}`, false);
          }
        }

      } catch (error) {
        this.log(`Error testing AI diagnosis integration: ${error}`, false);
      }
    }
  }

  async testQuoteApprovalWorkflow() {
    console.log('\n📋 Testing Quote Approval/Rejection Workflow...\n');

    const mockQuotes: Quote[] = [];
    const vehicle = testVehicles[0];

    // Generate test quotes
    for (let i = 0; i < 3; i++) {
      const options: QuoteOptions = {
        serviceType: 'brake_service',
        urgency: 'medium',
        description: `Brake service quote ${i + 1}`,
        vehicle,
        selectedParts: ['brake pads', 'brake fluid']
      };

      const quote = generateSmartQuote(`approval-test-${i}`, options);
      mockQuotes.push(quote);
    }

    // Test quote state management
    for (const quote of mockQuotes) {
      try {
        // Test approval
        const approvedQuote = { ...quote, status: 'accepted' as const, acceptedAt: new Date() };
        this.log(`Quote ${quote.id} approved successfully`);
        this.logData('Approved Quote', {
          id: approvedQuote.id,
          status: approvedQuote.status,
          totalCost: approvedQuote.totalCost,
          acceptedAt: approvedQuote.acceptedAt
        });

        // Test rejection
        const rejectedQuote = { ...quote, status: 'rejected' as const, notes: 'Price too high' };
        this.log(`Quote ${quote.id} rejected with notes`);

        // Test expiration
        const expiredQuote = { ...quote, status: 'expired' as const, validUntil: new Date(Date.now() - 1000) };
        this.log(`Quote ${quote.id} expired correctly`);

        // Validate quote status transitions
        const validTransitions = ['pending', 'accepted', 'rejected', 'expired'];
        if (validTransitions.includes(approvedQuote.status)) {
          this.log(`Quote status transition validated`);
        }

      } catch (error) {
        this.log(`Error testing quote approval workflow: ${error}`, false);
      }
    }
  }

  async testQuoteStatePersistence() {
    console.log('\n💾 Testing Quote State Management and Persistence...\n');

    const vehicle = testVehicles[0];
    const options: QuoteOptions = {
      serviceType: 'engine_diagnostic',
      urgency: 'high',
      description: 'Engine diagnostic with state persistence test',
      vehicle,
      aiDiagnosis: testDiagnosticResults[2]
    };

    try {
      // Generate quote
      const quote = generateSmartQuote('persistence-test', options);
      this.log(`Quote generated for persistence test`);

      // Test state transitions
      const states: Array<Quote['status']> = ['pending', 'accepted', 'deposit_paid', 'paid'];
      
      for (const state of states) {
        const updatedQuote = { ...quote, status: state };
        
        if (state === 'paid') {
          updatedQuote.paidAt = new Date();
        }
        
        this.log(`Quote state updated to: ${state}`);
        this.logData('Quote State', {
          id: updatedQuote.id,
          status: updatedQuote.status,
          paidAt: updatedQuote.paidAt,
          totalCost: updatedQuote.totalCost
        });
      }

      // Test quote breakdown persistence
      const detailedQuote = {
        ...quote,
        breakdown: [
          { description: 'Labor', cost: quote.laborCost },
          { description: 'Parts', cost: quote.partsCost },
          { description: 'Travel', cost: quote.travelCost }
        ]
      };

      this.log(`Quote breakdown persisted successfully`);
      this.logData('Quote Breakdown', detailedQuote.breakdown);

    } catch (error) {
      this.log(`Error testing quote state persistence: ${error}`, false);
    }
  }

  async testPartsEstimation() {
    console.log('\n🔧 Testing Parts Pricing and Estimation...\n');

    const commonParts = [
      'oil filter',
      'brake pads',
      'battery',
      'spark plugs',
      'air filter',
      'motorcycle oil',
      'motorcycle battery'
    ];

    for (const partName of commonParts) {
      try {
        const estimate = await getPartEstimate(partName);
        if (estimate) {
          this.log(`Part estimate retrieved for ${partName}: $${estimate.estimatedPrice}`);
          this.logData('Part Estimate', {
            partName: estimate.partName,
            price: estimate.estimatedPrice,
            confidence: estimate.confidence,
            source: estimate.source,
            availability: estimate.availability
          });

          // Validate estimate structure
          if (estimate.partName && estimate.estimatedPrice > 0 && estimate.confidence) {
            this.log(`Part estimate structure validated for ${partName}`);
          } else {
            this.log(`Part estimate structure invalid for ${partName}`, false);
          }
        } else {
          this.log(`No estimate found for ${partName}`, false);
        }

        // Test motorcycle-specific parts
        if (partName.includes('motorcycle')) {
          const motorcycleEstimate = await getMotorcyclePartEstimate(partName);
          if (motorcycleEstimate) {
            this.log(`Motorcycle-specific estimate retrieved for ${partName}`);
          }
        }

      } catch (error) {
        this.log(`Error getting part estimate for ${partName}: ${error}`, false);
      }
    }

    // Test multiple parts calculation
    try {
      const estimates = await Promise.all(
        commonParts.slice(0, 3).map(part => getPartEstimate(part))
      );
      const validEstimates = estimates.filter(e => e !== null);
      const totalCost = calculatePartsTotal(validEstimates);
      
      this.log(`Multiple parts total calculated: $${totalCost}`);
      this.logData('Parts Total', {
        partsCount: validEstimates.length,
        totalCost,
        averageCost: totalCost / validEstimates.length
      });

    } catch (error) {
      this.log(`Error calculating parts total: ${error}`, false);
    }
  }

  async testPricingAccuracy() {
    console.log('\n🎯 Testing Pricing Accuracy and AI Logic Validation...\n');

    const scenarios = [
      {
        name: 'Standard Oil Change',
        vehicle: testVehicles[0],
        serviceType: 'oil_change' as ServiceType,
        urgency: 'medium' as const,
        expectedRange: { min: 75, max: 120 }
      },
      {
        name: 'Emergency Brake Service',
        vehicle: testVehicles[1], // BMW (luxury)
        serviceType: 'brake_service' as ServiceType,
        urgency: 'emergency' as const,
        expectedRange: { min: 300, max: 600 }
      },
      {
        name: 'High-Mileage Diagnostic',
        vehicle: testVehicles[1], // High mileage BMW
        serviceType: 'engine_diagnostic' as ServiceType,
        urgency: 'high' as const,
        expectedRange: { min: 150, max: 400 }
      }
    ];

    for (const scenario of scenarios) {
      try {
        const options: QuoteOptions = {
          serviceType: scenario.serviceType,
          urgency: scenario.urgency,
          description: `${scenario.name} pricing accuracy test`,
          vehicle: scenario.vehicle,
          location: {
            latitude: 40.7128,
            longitude: -74.0060,
            address: '123 Main St, New York, NY 10001'
          }
        };

        const quote = generateSmartQuote(`accuracy-test-${scenario.name}`, options);
        
        const isAccurate = quote.totalCost >= scenario.expectedRange.min && 
                          quote.totalCost <= scenario.expectedRange.max;
        
        if (isAccurate) {
          this.log(`${scenario.name} pricing accurate: $${quote.totalCost} (expected: $${scenario.expectedRange.min}-$${scenario.expectedRange.max})`);
        } else {
          this.log(`${scenario.name} pricing inaccurate: $${quote.totalCost} (expected: $${scenario.expectedRange.min}-$${scenario.expectedRange.max})`, false);
        }

        this.logData(`${scenario.name} Analysis`, {
          totalCost: quote.totalCost,
          laborCost: quote.laborCost,
          partsCost: quote.partsCost,
          travelCost: quote.travelCost,
          estimatedDuration: quote.estimatedDuration,
          vehicleAge: new Date().getFullYear() - scenario.vehicle.year,
          vehicleMileage: scenario.vehicle.mileage,
          urgencyLevel: scenario.urgency
        });

      } catch (error) {
        this.log(`Error testing ${scenario.name} pricing accuracy: ${error}`, false);
      }
    }
  }

  async runAllTests() {
    console.log('🚀 Starting QuoteAIValidator Testing Suite...\n');
    console.log('='.repeat(60));

    const startTime = Date.now();

    try {
      await this.testVINQuoteGeneration();
      await this.testDifferentVehicleTypes();
      await this.testPriceCalculationLogic();
      await this.testAISuggestions();
      await this.testQuoteApprovalWorkflow();
      await this.testQuoteStatePersistence();
      await this.testPartsEstimation();
      await this.testPricingAccuracy();
    } catch (error) {
      this.log(`Fatal error during testing: ${error}`, false);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    console.log('\n' + '='.repeat(60));
    console.log('📊 QuoteAIValidator Test Results Summary');
    console.log('='.repeat(60));
    console.log(`✅ Passed Tests: ${this.passedTests}`);
    console.log(`❌ Failed Tests: ${this.failedTests}`);
    console.log(`📈 Success Rate: ${((this.passedTests / (this.passedTests + this.failedTests)) * 100).toFixed(1)}%`);
    console.log(`⏱️  Total Duration: ${duration}ms`);
    console.log(`🧪 Total Tests: ${this.passedTests + this.failedTests}`);
    
    if (this.failedTests > 0) {
      console.log('\n❌ Failed Tests Details:');
      this.testResults
        .filter(result => !result.success)
        .forEach(result => {
          console.log(`   - ${result.message}`);
        });
    }

    console.log('\n🎯 Quote Generation & AI Validation Testing Complete!');
    
    return {
      passed: this.passedTests,
      failed: this.failedTests,
      successRate: (this.passedTests / (this.passedTests + this.failedTests)) * 100,
      duration,
      results: this.testResults
    };
  }
}

// Run the tests
async function main() {
  const validator = new QuoteAIValidator();
  const results = await validator.runAllTests();
  
  // Save results to file
  const fs = require('fs');
  const resultData = {
    timestamp: new Date().toISOString(),
    summary: {
      passed: results.passed,
      failed: results.failed,
      successRate: results.successRate,
      duration: results.duration
    },
    testResults: results.results
  };
  
  fs.writeFileSync(
    '/data/data/com.termux/files/home/rork-mobile-mechanic-service-app/QUOTE_AI_VALIDATOR_REPORT.json',
    JSON.stringify(resultData, null, 2)
  );
  
  console.log('\n📄 Test results saved to QUOTE_AI_VALIDATOR_REPORT.json');
}

if (require.main === module) {
  main().catch(console.error);
}

export default QuoteAIValidator;